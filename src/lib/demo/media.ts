"use client";

export const ACCEPTED_MIME = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_FILE_BYTES = 15 * 1024 * 1024;
export const MAX_BATCH_BYTES = 60 * 1024 * 1024;
export const MAX_INPUT_PIXELS = 40_000_000;
export const MAX_NORMALIZED_LONG_EDGE = 2560;
export const MIN_COUNT = 1;
export const MAX_COUNT = 6;

export type MediaError =
  | { code: "unsupported-mime"; mime: string }
  | { code: "file-too-large"; byteSize: number }
  | { code: "batch-too-large"; totalBytes: number }
  | { code: "too-many-pixels"; pixels: number }
  | { code: "decode-failed" };

export class MediaProcessingError extends Error {
  constructor(public readonly detail: MediaError) {
    super(detail.code);
  }
}

export interface NormalizedImage {
  blob: Blob;
  mime: "image/png" | "image/jpeg";
  width: number;
  height: number;
  byteSize: number;
  contentHash: string;
}

export function checkBatch(files: File[]): MediaError | null {
  if (files.length > MAX_COUNT) return null; // caller handles overflow selection UI, not a hard error here
  const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
  if (totalBytes > MAX_BATCH_BYTES) return { code: "batch-too-large", totalBytes };
  return null;
}

async function hashBlob(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * EXIF orientation is resolved via createImageBitmap's imageOrientation option
 * rather than manual EXIF byte parsing — supported in current Safari/Chrome mobile,
 * and avoids shipping a hand-rolled EXIF parser for a one-time normalization step.
 */
export async function normalizeImage(file: File): Promise<NormalizedImage> {
  if (!(ACCEPTED_MIME as readonly string[]).includes(file.type)) {
    throw new MediaProcessingError({ code: "unsupported-mime", mime: file.type });
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new MediaProcessingError({ code: "file-too-large", byteSize: file.size });
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new MediaProcessingError({ code: "decode-failed" });
  }

  if (bitmap.width * bitmap.height > MAX_INPUT_PIXELS) {
    bitmap.close();
    throw new MediaProcessingError({ code: "too-many-pixels", pixels: bitmap.width * bitmap.height });
  }

  const longEdge = Math.max(bitmap.width, bitmap.height);
  const scale = longEdge > MAX_NORMALIZED_LONG_EDGE ? MAX_NORMALIZED_LONG_EDGE / longEdge : 1;
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new MediaProcessingError({ code: "decode-failed" });
  }
  // Transparent PNGs are composited onto a white backdrop before downstream templates
  // draw on top, so the output never carries unintended transparency into the design.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const outMime = file.type === "image/png" ? "image/png" : "image/jpeg";
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, outMime, 0.9));
  if (!blob) throw new MediaProcessingError({ code: "decode-failed" });

  const contentHash = await hashBlob(blob);
  return { blob, mime: outMime, width, height, byteSize: blob.size, contentHash };
}
