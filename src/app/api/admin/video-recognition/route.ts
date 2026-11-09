import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { VideoRecognitionError, recognizeVideo } from "@/lib/ai/video-recognition";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_VIDEO_BYTES = 250 * 1024 * 1024;
const MAX_REQUEST_BYTES = MAX_VIDEO_BYTES + 2 * 1024 * 1024;
const EXTENSIONS = new Set(["mp4", "mov", "m4v", "webm"]);

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

  const file = form.get("video");
  if (!(file instanceof File) || file.size === 0) return json(422, { ok: false, reason: "videoRequired" });
  if (file.size > MAX_VIDEO_BYTES) return json(413, { ok: false, reason: "tooLarge" });
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!EXTENSIONS.has(extension)) return json(415, { ok: false, reason: "unsupportedFormat" });
  const description = String(form.get("description") ?? "").slice(0, 1_000);
  const customerFacts = String(form.get("customerFacts") ?? "").slice(0, 6_000);

  try {
    const result = await recognizeVideo({ videoBytes: Buffer.from(await file.arrayBuffer()), extension, customerDescription: description, customerFacts });
    return json(200, { ok: true, result });
  } catch (error) {
    if (error instanceof VideoRecognitionError) {
      const status = error.code === "provider_unavailable" ? 503 : error.code === "video_too_long" ? 422 : error.code === "provider_failed" ? 502 : error.code === "ffmpeg_missing" ? 503 : 422;
      return json(status, { ok: false, reason: error.code, message: error.message });
    }
    return json(500, { ok: false, reason: "processingFailed", message: "Video analysis failed. The temporary upload was removed." });
  }
}
