import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { Storage } from "@google-cloud/storage";
import { appUrl } from "@/lib/app-url";

export type StoredObject = { bytes: Buffer; mime: string };

const MIME_BY_EXT: Record<string, string> = { png: "image/png", jpg: "image/jpeg", webp: "image/webp", svg: "image/svg+xml" };
const EXT_BY_MIME: Record<string, string> = Object.fromEntries(Object.entries(MIME_BY_EXT).map(([ext, mime]) => [mime, ext]));
const GEN_KEY_PATTERN = /^gen\/([a-z0-9]{10,40})\/([a-z0-9]{10,40})-(in|out)\.(?:png|jpg|webp|svg)$/;
// pub/ 前缀存放"用户主动要发到公网社交平台"的导出图，允许匿名读取（Ayrshare 等外部服务要能直接抓取），
// 和 gen/ 私有前缀严格分开，/api/media 只认 GEN_KEY_PATTERN，不会误读到公开前缀。
const PUB_KEY_PATTERN = /^pub\/([a-z0-9]{10,40})\/([a-z0-9]{10,40})-([a-f0-9]{16,32})\.(?:png|jpg|webp)$/;
// nails/ 前缀存放美甲工作室私有素材库照片，按 studioId 归属，和 gen/（AI 生成）、pub/（公开导出）互相隔离。
const NAILS_MEDIA_KEY_PATTERN = /^nails\/([a-z0-9]{10,40})\/([a-z0-9]{10,40})\.(?:png|jpg|webp)$/;

const LOCAL_ROOT = path.join(process.cwd(), ".data", "uploads");

export function isMediaKey(key: string) {
  return GEN_KEY_PATTERN.test(key) || PUB_KEY_PATTERN.test(key) || NAILS_MEDIA_KEY_PATTERN.test(key);
}

export function parseMediaKey(key: string) {
  const m = GEN_KEY_PATTERN.exec(key);
  return m ? { userId: m[1], generationId: m[2], role: m[3] as "in" | "out" } : null;
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

export function isPublicMediaKey(key: string) {
  return PUB_KEY_PATTERN.test(key);
}

export function parsePublicMediaKey(key: string) {
  const m = PUB_KEY_PATTERN.exec(key);
  return m ? { userId: m[1], designId: m[2] } : null;
}

export function publicMediaKey(userId: string, designId: string, mime: string) {
  const ext = EXT_BY_MIME[mime];
  if (!ext || ext === "svg") throw new Error(`unsupported mime ${mime}`);
  return `pub/${userId}/${designId}-${randomBytes(12).toString("hex")}.${ext}`;
}

export function publicMediaUrl(key: string) {
  return `${appUrl()}/api/public-media/${key}`;
}

export function isNailsMediaKey(key: string) {
  return NAILS_MEDIA_KEY_PATTERN.test(key);
}

export function parseNailsMediaKey(key: string) {
  const m = NAILS_MEDIA_KEY_PATTERN.exec(key);
  return m ? { studioId: m[1], assetId: m[2] } : null;
}

export function nailsMediaKey(studioId: string, assetId: string, mime: string) {
  const ext = EXT_BY_MIME[mime];
  if (!ext || ext === "svg") throw new Error(`unsupported mime ${mime}`);
  return `nails/${studioId}/${assetId}.${ext}`;
}

export function nailsMediaUrl(key: string) {
  return `/api/nails-media/${key}`;
}

type Backend = {
  put(key: string, bytes: Buffer, mime: string): Promise<void>;
  get(key: string): Promise<Buffer | null>;
  remove(key: string): Promise<void>;
};

const localBackend: Backend = {
  async put(key, bytes) {
    const file = path.join(LOCAL_ROOT, key);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, bytes);
  },
  async get(key) {
    try {
      return await readFile(path.join(LOCAL_ROOT, key));
    } catch {
      return null;
    }
  },
  async remove(key) {
    await rm(path.join(LOCAL_ROOT, key), { force: true });
  },
};

function gcsBackend(bucketName: string): Backend {
  const bucket = new Storage().bucket(bucketName);
  return {
    async put(key, bytes, mime) {
      await bucket.file(key).save(bytes, { contentType: mime, resumable: false, metadata: { cacheControl: "private, max-age=31536000" } });
    },
    async get(key) {
      try {
        const [bytes] = await bucket.file(key).download();
        return bytes;
      } catch (err) {
        if ((err as { code?: number }).code === 404) return null;
        throw err;
      }
    },
    async remove(key) {
      await bucket.file(key).delete({ ignoreNotFound: true });
    },
  };
}

let backend: Backend | null = null;

function getBackend(): Backend {
  if (backend) return backend;
  const kind = process.env.STORAGE ?? (process.env.NODE_ENV === "production" ? "" : "local");
  if (kind === "local") backend = localBackend;
  else if (kind === "gcs") {
    const bucket = process.env.GCS_BUCKET;
    if (!bucket) throw new Error("GCS_BUCKET is required when STORAGE=gcs");
    backend = gcsBackend(bucket);
  } else throw new Error(`STORAGE must be "local" or "gcs" (got "${kind}")`);
  return backend;
}

export async function putObject(key: string, bytes: Buffer) {
  if (!isMediaKey(key)) throw new Error("invalid media key");
  await getBackend().put(key, bytes, mimeOf(key));
}

export async function getObject(key: string): Promise<StoredObject | null> {
  if (!isMediaKey(key)) return null;
  const bytes = await getBackend().get(key);
  return bytes ? { bytes, mime: mimeOf(key) } : null;
}

export async function deleteObject(key: string) {
  if (!isMediaKey(key)) return;
  await getBackend().remove(key);
}

function mimeOf(key: string) {
  return MIME_BY_EXT[key.split(".").pop() ?? ""] ?? "application/octet-stream";
}
