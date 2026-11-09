import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { VideoRecognitionError, recognizeImage, recognizeVideo } from "@/lib/ai/video-recognition";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_VIDEO_BYTES = 250 * 1024 * 1024;
const MAX_CLOUD_VIDEO_BYTES = 30 * 1024 * 1024;
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const MAX_ALLOWED_VIDEO_BYTES = process.env.K_SERVICE ? MAX_CLOUD_VIDEO_BYTES : MAX_VIDEO_BYTES;
const MAX_REQUEST_BYTES = MAX_ALLOWED_VIDEO_BYTES + 2 * 1024 * 1024;
const VIDEO_TYPES = new Map([["mp4", "video/mp4"], ["mov", "video/quicktime"], ["m4v", "video/mp4"], ["webm", "video/webm"]]);
const IMAGE_TYPES = new Map([["jpg", "image/jpeg"], ["jpeg", "image/jpeg"], ["png", "image/png"], ["webp", "image/webp"]]);

function json(status: number, body: Record<string, unknown>) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store, private" } });
}

async function readBoundedForm(request: NextRequest): Promise<FormData | null> {
  if (!request.body) return null;
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_REQUEST_BYTES) {
        await reader.cancel();
        throw new VideoRecognitionError("video_invalid", "Upload exceeds the 250 MB limit");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try {
    return await new Request(request.url, { method: "POST", headers: request.headers, body: bytes }).formData();
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  if (process.env.ENABLE_VIDEO_LAB !== "true") return json(404, { ok: false, reason: "notFound" });
  const user = await getCurrentUser();
  if (!user) return json(401, { ok: false, reason: "unauthorized" });
  if (user.role !== "ADMIN") return json(403, { ok: false, reason: "forbidden" });

  const allowedOrigins = new Set([new URL(request.url).origin]);
  if (process.env.APP_URL) allowedOrigins.add(new URL(process.env.APP_URL).origin);
  const origin = request.headers.get("origin");
  if (!origin || !allowedOrigins.has(origin)) return json(403, { ok: false, reason: "origin" });

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_REQUEST_BYTES) return json(413, { ok: false, reason: "tooLarge" });
  let form: FormData | null;
  try { form = await readBoundedForm(request); }
  catch { return json(413, { ok: false, reason: "tooLarge" }); }
  if (!form) return json(400, { ok: false, reason: "invalidForm" });

  const file = form.get("file") ?? form.get("video");
  if (!(file instanceof File) || file.size === 0) return json(422, { ok: false, reason: "videoRequired" });
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const videoMimeType = VIDEO_TYPES.get(extension);
  const imageMimeType = IMAGE_TYPES.get(extension);
  if (!videoMimeType && !imageMimeType) return json(415, { ok: false, reason: "unsupportedFormat" });
  const maxBytes = videoMimeType ? MAX_ALLOWED_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (file.size > maxBytes) return json(413, { ok: false, reason: videoMimeType ? process.env.K_SERVICE ? "videoTooLargeCloud" : "tooLarge" : "imageTooLarge" });
  const description = String(form.get("description") ?? "").slice(0, 1_000);
  const customerFacts = String(form.get("customerFacts") ?? "").slice(0, 6_000);

  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const result = videoMimeType
      ? await recognizeVideo({ videoBytes: bytes, extension, customerDescription: description, customerFacts })
      : await recognizeImage({ imageBytes: bytes, mimeType: imageMimeType!, customerDescription: description, customerFacts });
    return json(200, { ok: true, result });
  } catch (error) {
    if (error instanceof VideoRecognitionError) {
      const status = error.code === "provider_unavailable" ? 503 : error.code === "video_too_long" ? 422 : error.code === "provider_failed" ? 502 : error.code === "ffmpeg_missing" ? 503 : 422;
      return json(status, { ok: false, reason: error.code, message: error.message });
    }
    return json(500, { ok: false, reason: "processingFailed", message: "Video analysis failed. The temporary upload was removed." });
  }
}
