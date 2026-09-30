import "server-only";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type StoredObject = { bytes: Buffer; mime: string };

const MIME_BY_EXT: Record<string, string> = { png: "image/png", jpg: "image/jpeg", webp: "image/webp", svg: "image/svg+xml" };
const EXT_BY_MIME: Record<string, string> = Object.fromEntries(Object.entries(MIME_BY_EXT).map(([ext, mime]) => [mime, ext]));
const KEY_PATTERN = /^gen\/[a-z0-9]{10,40}\/[a-z0-9]{10,40}-(in|out)\.(png|jpg|webp|svg)$/;

const LOCAL_ROOT = path.join(process.cwd(), ".data", "uploads");

export function isMediaKey(key: string) {
  return KEY_PATTERN.test(key);
}

export function mediaKey(userId: string, generationId: string, role: "in" | "out", mime: string) {
  const ext = EXT_BY_MIME[mime];
  if (!ext) throw new Error(`unsupported mime ${mime}`);
  return `gen/${userId}/${generationId}-${role}.${ext}`;
}

export function mediaUrl(key: string) {
  return `/api/media/${key}`;
}

export function keyFromMediaUrl(url: string) {
  const key = url.replace(/^\/api\/media\//, "");
  return isMediaKey(key) ? key : null;
}

function assertBackend() {
  const backend = process.env.STORAGE ?? "local";
  if (backend !== "local") throw new Error(`STORAGE=${backend} is not implemented yet (GCS comes before launch)`);
}

export async function putObject(key: string, bytes: Buffer) {
  if (!isMediaKey(key)) throw new Error("invalid media key");
  assertBackend();
  const file = path.join(LOCAL_ROOT, key);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, bytes);
}

export async function getObject(key: string): Promise<StoredObject | null> {
  if (!isMediaKey(key)) return null;
  assertBackend();
  try {
    const bytes = await readFile(path.join(LOCAL_ROOT, key));
    return { bytes, mime: MIME_BY_EXT[key.split(".").pop() ?? ""] ?? "application/octet-stream" };
  } catch {
    return null;
  }
}
