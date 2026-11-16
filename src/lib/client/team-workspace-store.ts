"use client";

const DB_NAME = "postory-team-workspace";
const DB_VERSION = 1;
const STORE_NAME = "workspace";
const SNAPSHOT_KEY = "default";
const LEGACY_KEY = "postory-team-workspace-preview-v1";

export type TeamWorkspaceSnapshot = {
  posts: unknown[];
  assets: unknown[];
  business: string;
  industry: string;
  location: string;
};

export type TeamAsset = {
  id: string;
  name: string;
  type: string;
  size: number;
  description: string;
  createdAt: string;
  blob: Blob;
};

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("workspace_storage_unavailable"));
  });
}

export async function loadTeamWorkspace(): Promise<TeamWorkspaceSnapshot | null> {
  try {
    const database = await openDatabase();
    const snapshot = await new Promise<TeamWorkspaceSnapshot | undefined>((resolve, reject) => {
      const request = database.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(SNAPSHOT_KEY);
      request.onsuccess = () => resolve(request.result as TeamWorkspaceSnapshot | undefined);
      request.onerror = () => reject(request.error ?? new Error("workspace_read_failed"));
    });
    database.close();
    if (snapshot) return snapshot;
  } catch { /* Fall back to the old draft store if IndexedDB is unavailable. */ }

  try {
    const saved = localStorage.getItem(LEGACY_KEY);
    if (!saved) return null;
    const posts = JSON.parse(saved) as unknown[];
    return { posts, assets: [], business: "", industry: "其他本地商家", location: "" };
  } catch { return null; }
}

export async function saveTeamWorkspace(snapshot: TeamWorkspaceSnapshot) {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(snapshot, SNAPSHOT_KEY);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("workspace_save_failed"));
    transaction.onabort = () => reject(transaction.error ?? new Error("workspace_save_aborted"));
  });
  database.close();
  if (typeof BroadcastChannel !== "undefined") {
    const channel = new BroadcastChannel(DB_NAME);
    channel.postMessage("updated");
    channel.close();
  }
}

export function subscribeTeamWorkspace(onUpdate: () => void) {
  if (typeof BroadcastChannel === "undefined") return () => undefined;
  const channel = new BroadcastChannel(DB_NAME);
  channel.onmessage = () => onUpdate();
  return () => channel.close();
}
