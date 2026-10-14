import type { NextRequest } from "next/server";
import type { RatioId } from "@/components/create/studio-options";
import { decodeUpload } from "@/lib/ai/image-bytes";
import { openAiImageProvider } from "@/lib/ai/openai-image-provider";
import { completeDemoGeneration, failDemoGeneration, getDemoTrialIdentity, reserveDemoGeneration } from "@/lib/demo/trial-protection";
import { verifyDemoTurnstile } from "@/lib/demo/turnstile";

export const runtime = "nodejs";
export const maxDuration = 240;

const INDUSTRIES = new Set(["nails", "sushi"]);
const RATIOS = new Set<RatioId>(["square", "portrait", "story", "landscape"]);
const MAX_REQUEST_BYTES = 11 * 1024 * 1024;

function response(status: number, payload: Record<string, unknown>) {
  return Response.json(payload, { status, headers: { "Cache-Control": "no-store, private" } });
}

async function readFormData(request: NextRequest): Promise<{ form: FormData } | { error: "tooLarge" | "invalid" }> {
  if (!request.body) return { error: "invalid" };
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
        return { error: "tooLarge" };
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
    const form = await new Request(request.url, {
      method: "POST",
      headers: request.headers,
      body: bytes,
    }).formData();
    return { form };
  } catch {
    return { error: "invalid" };
  }
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  // Cloud Run exposes the internal container URL as request.url. Use the
  // configured public app origin for same-origin and Turnstile host checks.
  const expectedOrigin = new URL(process.env.APP_URL || request.url).origin;
  const requestOrigin = request.headers.get("origin");
  if (requestOrigin !== expectedOrigin) {
    console.warn(JSON.stringify({
      event: "demo_request_origin_rejected",
      requestId,
      expectedOrigin,
      originPresent: requestOrigin !== null,
      originMatches: false,
      receivedOrigin: requestOrigin?.slice(0, 256) ?? null,
      refererMatches: request.headers.get("referer")?.startsWith(`${expectedOrigin}/`) ?? false,
      fetchSite: request.headers.get("sec-fetch-site")?.slice(0, 32) ?? null,
    }));
    return response(403, { ok: false, reason: "origin", requestId });
  }
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_REQUEST_BYTES) return response(413, { ok: false, reason: "tooLarge" });

  const expectedHostname = new URL(expectedOrigin).hostname;
  const turnstile = await verifyDemoTurnstile(request.headers.get("x-turnstile-token") ?? "", expectedHostname);
  console.info(JSON.stringify({
    event: "demo_turnstile_diagnostic",
    requestId,
    result: turnstile.ok ? "accepted" : "rejected",
    reason: turnstile.ok ? undefined : turnstile.reason,
    expectedHostname,
    diagnostic: turnstile.diagnostic,
  }));
  if (!turnstile.ok) return response(turnstile.reason === "notConfigured" ? 503 : 403, { ok: false, reason: turnstile.reason, requestId });
  if (!process.env.OPENAI_API_KEY) return response(503, { ok: false, reason: "providerUnavailable" });

  const identity = await getDemoTrialIdentity(request);
  if (!identity) return response(503, { ok: false, reason: "trustedClientIpUnavailable" });

  const idempotencyKey = request.headers.get("idempotency-key") ?? "";
  if (!/^[a-z0-9-]{20,80}$/i.test(idempotencyKey)) return response(400, { ok: false, reason: "invalidRequest" });

  const parsedForm = await readFormData(request);
  if ("error" in parsedForm) return response(parsedForm.error === "tooLarge" ? 413 : 400, { ok: false, reason: parsedForm.error });
  const form = parsedForm.form;
  const industry = String(form.get("industry") ?? "");
  const promptText = String(form.get("prompt") ?? "").trim();
  const ratio = String(form.get("ratio") ?? "portrait") as RatioId;
  const image = form.get("photo");
  if (!INDUSTRIES.has(industry) || !RATIOS.has(ratio) || !promptText || promptText.length > 500 || !(image instanceof File)) {
    return response(400, { ok: false, reason: "invalidRequest" });
  }
  if (image.size > 10 * 1024 * 1024) return response(413, { ok: false, reason: "tooLarge" });
  const encoded = Buffer.from(await image.arrayBuffer()).toString("base64");
  const upload = decodeUpload(`data:${image.type};base64,${encoded}`);
  if (!upload.ok) return response(400, { ok: false, reason: upload.error });

  const reservation = await reserveDemoGeneration({
    identity,
    industry: industry as "nails" | "sushi",
    idempotencyKey,
    overrideToken: String(form.get("overrideToken") ?? "") || undefined,
  });
  if (!reservation.ok) return response(reservation.reason === "dailyCap" ? 429 : 403, { ok: false, reason: reservation.reason });

  try {
    const subjectPreservation = industry === "nails"
      ? "Keep the uploaded manicure exactly recognizable: preserve each nail's design, length, shape, polish color, decoration, the number of fingers, natural anatomy, and skin tone. Do not redesign the nails, add jewelry, or alter the hand."
      : "Keep the uploaded sushi exactly recognizable: preserve the dish, ingredients, piece count, shapes, arrangement, garnish, plate, and serving presentation. Do not add, remove, replace, or rearrange food.";
    const enhancement = "Apply a restrained professional photo retouch while preserving the original subject and composition: gently improve exposure, white balance, color fidelity, contrast, and visible detail; reduce mild blur, image noise, and compression artifacts; sharpen naturally present details without halos or plastic texture. If the source is soft, recover only plausible detail and do not invent textures.";
    const finalPrompt = `${subjectPreservation} ${enhancement} Create only an art-directed photo background and subtle decorative visual treatment around the preserved subject. Do not render any text, letters, numbers, logos, watermarks, prices, dates, or UI. Leave clear negative space for code-rendered typography. Customer visual direction: ${promptText}`;
    const out = await openAiImageProvider.generate({ prompt: finalPrompt, ratio, quality: "standard", input: upload });
    await completeDemoGeneration(reservation.id, out.costMicros);
    return response(200, { ok: true, generationId: reservation.id, quality: "medium", imageDataUrl: `data:${out.mime};base64,${out.bytes.toString("base64")}` });
  } catch (error) {
    await failDemoGeneration(reservation.id).catch(() => undefined);
    console.error(`[demo-generation ${reservation.id}]`, error instanceof Error ? error.message : "provider failure");
    return response(502, { ok: false, reason: "generationFailed" });
  }
}
