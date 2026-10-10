"use client";

import { type DemoSession, type IndustryId, parseDemoSession, STEPS } from "./contracts";

const DB_NAME = "postory.demo.v2";
const DB_VERSION = 1;
const SESSION_STORE = "sessions";
const BLOB_STORE = "blobs";
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(SESSION_STORE)) {
        db.createObjectStore(SESSION_STORE, { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains(BLOB_STORE)) {
        db.createObjectStore(BLOB_STORE, { keyPath: "key" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function sessionKey(industryId: IndustryId, sessionId: string) {
  return `postory.demo.v2.${industryId}.${sessionId}`;
}

function activePointerKey(industryId: IndustryId) {
  return `postory.demo.v2.${industryId}.active`;
}

async function tx<T>(storeName: string, mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    const req = run(store);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function randomId() {
  return crypto.randomUUID();
}

export function createEmptySession(industryId: IndustryId, configVersion: string, locale: string): DemoSession {
  const now = new Date();
  const expires = new Date(now.getTime() + SESSION_TTL_MS);
  return {
    schemaVersion: 2,
    id: randomId(),
    industryId,
    configVersion,
    revision: 0,
    locale,
    assets: [],
    assetOrder: [],
    lastStep: "landing",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    expiresAt: expires.toISOString(),
  };
}

export async function saveSession(session: DemoSession): Promise<void> {
  const record = { key: sessionKey(session.industryId, session.id), session };
  await tx(SESSION_STORE, "readwrite", (store) => store.put(record));
  await tx(SESSION_STORE, "readwrite", (store) => store.put({ key: activePointerKey(session.industryId), sessionId: session.id }));
}

export async function loadSession(industryId: IndustryId, sessionId: string): Promise<DemoSession | null> {
  const record = await tx<{ key: string; session: unknown } | undefined>(SESSION_STORE, "readonly", (store) =>
    store.get(sessionKey(industryId, sessionId)),
  );
  if (!record) return null;
  const parsed = parseDemoSession(record.session);
  if (new Date(parsed.expiresAt).getTime() < Date.now()) {
    await deleteSession(industryId, sessionId);
    return null;
  }
  return parsed;
}

export async function loadActiveSession(industryId: IndustryId): Promise<DemoSession | null> {
  const pointer = await tx<{ key: string; sessionId: string } | undefined>(SESSION_STORE, "readonly", (store) =>
    store.get(activePointerKey(industryId)),
  );
  if (!pointer) return null;
  return loadSession(industryId, pointer.sessionId);
}

/**
 * Compare-and-swap update: caller supplies the revision it last observed.
 * A stale revision means another tab wrote in between — caller must reload and retry
 * rather than silently overwrite (V2.0 §10 multi-tab rule).
 */
export async function updateSession(
  industryId: IndustryId,
  sessionId: string,
  expectedRevision: number,
  mutate: (session: DemoSession) => DemoSession,
): Promise<{ ok: true; session: DemoSession } | { ok: false; reason: "stale-revision" | "not-found" }> {
  const current = await loadSession(industryId, sessionId);
  if (!current) return { ok: false, reason: "not-found" };
  if (current.revision !== expectedRevision) return { ok: false, reason: "stale-revision" };
  const next = mutate(current);
  const withMeta: DemoSession = { ...next, revision: current.revision + 1, updatedAt: new Date().toISOString() };
  await saveSession(withMeta);
  return { ok: true, session: withMeta };
}

export async function deleteSession(industryId: IndustryId, sessionId: string): Promise<void> {
  await tx(SESSION_STORE, "readwrite", (store) => store.delete(sessionKey(industryId, sessionId)));
}

export async function putBlob(assetId: string, blob: Blob): Promise<void> {
  await tx(BLOB_STORE, "readwrite", (store) => store.put({ key: assetId, blob, storedAt: Date.now() }));
}

export async function getBlob(assetId: string): Promise<Blob | null> {
  const record = await tx<{ key: string; blob: Blob } | undefined>(BLOB_STORE, "readonly", (store) => store.get(assetId));
  return record?.blob ?? null;
}

export async function deleteBlob(assetId: string): Promise<void> {
  await tx(BLOB_STORE, "readwrite", (store) => store.delete(assetId));
}

/** Sweeps sessions and orphaned blobs past expiresAt. Call opportunistically on app entry, not on a timer. */
export async function cleanupExpired(): Promise<void> {
  const db = await openDb();
  const sessions = await new Promise<{ key: string; session: unknown }[]>((resolve, reject) => {
    const transaction = db.transaction(SESSION_STORE, "readonly");
    const store = transaction.objectStore(SESSION_STORE);
    const results: { key: string; session: unknown }[] = [];
    const cursorReq = store.openCursor();
    cursorReq.onsuccess = () => {
      const cursor = cursorReq.result;
      if (!cursor) return resolve(results);
      if ((cursor.value as { session?: unknown }).session) results.push(cursor.value);
      cursor.continue();
    };
    cursorReq.onerror = () => reject(cursorReq.error);
  });

  const liveAssetIds = new Set<string>();
  for (const record of sessions) {
    let parsed: DemoSession;
    try {
      parsed = parseDemoSession(record.session);
    } catch {
      await tx(SESSION_STORE, "readwrite", (store) => store.delete(record.key));
      continue;
    }
    if (new Date(parsed.expiresAt).getTime() < Date.now()) {
      await tx(SESSION_STORE, "readwrite", (store) => store.delete(record.key));
      continue;
    }
    for (const asset of parsed.assets) liveAssetIds.add(asset.id);
  }

  const blobKeys = await new Promise<string[]>((resolve, reject) => {
    const transaction = db.transaction(BLOB_STORE, "readonly");
    const store = transaction.objectStore(BLOB_STORE);
    const keys: string[] = [];
    const cursorReq = store.openKeyCursor();
    cursorReq.onsuccess = () => {
      const cursor = cursorReq.result;
      if (!cursor) return resolve(keys);
      keys.push(String(cursor.key));
      cursor.continue();
    };
    cursorReq.onerror = () => reject(cursorReq.error);
  });
  for (const key of blobKeys) {
    if (!liveAssetIds.has(key)) await deleteBlob(key);
  }
}

export function isValidStep(value: string): value is DemoSession["lastStep"] {
  return (STEPS as readonly string[]).includes(value);
}
