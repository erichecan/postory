import type { NextRequest } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { RatioId } from "@/components/create/studio-options";
import { decodeUpload } from "@/lib/ai/image-bytes";
import { buildDemoCampaignPrompt, type DemoIndustry } from "@/lib/ai/demo-campaign-prompt";
import { openAiImageProvider } from "@/lib/ai/openai-image-provider";
import type { StoredObject } from "@/lib/storage";
import { completeDemoGeneration, failDemoGeneration, getDemoTrialIdentity, reserveDemoGeneration } from "@/lib/demo/trial-protection";
import { verifyDemoTurnstile } from "@/lib/demo/turnstile";

export const runtime = "nodejs";
export const maxDuration = 240;

const INDUSTRIES = new Set(["nails", "sushi"]);
const RATIOS = new Set<RatioId>(["square", "portrait", "story", "landscape"]);
const MAX_REQUEST_BYTES = 11 * 1024 * 1024;
const SUSHI_REFERENCE_BY_DIRECTION: Record<string, { id: string; file: string }> = {
  "new-arrival": { id: "sushi-01", file: "sushi-01.webp" },
  "lunch-set": { id: "sushi-02", file: "sushi-02.webp" },
  "healthy-light": { id: "sushi-03", file: "sushi-03.webp" },
  "limited-offer": { id: "sushi-04", file: "sushi-04.webp" },
  "seafood-feature": { id: "sushi-05", file: "sushi-05.webp" },
  "premium-signature": { id: "sushi-06", file: "sushi-06.webp" },
  "signature-platter": { id: "sushi-07", file: "sushi-07.webp" },
  "date-night": { id: "sushi-08", file: "sushi-08.webp" },
};

async function loadSushiCampaignReference(direction: string): Promise<{ id: string; image: StoredObject } | null> {
  const reference = SUSHI_REFERENCE_BY_DIRECTION[direction];
  if (!reference) return null;
  const bytes = await readFile(path.join(process.cwd(), "public", "demo", "campaign-inspiration", reference.file));
  return { id: reference.id, image: { bytes, mime: "image/webp" } };
}

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

  const identity = await getDemoTrialIdentity(request, requestId);
  if (!identity) return response(503, { ok: false, reason: "trustedClientIpUnavailable", requestId });

  const idempotencyKey = request.headers.get("idempotency-key") ?? "";
  if (!/^[a-z0-9-]{20,80}$/i.test(idempotencyKey)) return response(400, { ok: false, reason: "invalidRequest" });

  const parsedForm = await readFormData(request);
  if ("error" in parsedForm) return response(parsedForm.error === "tooLarge" ? 413 : 400, { ok: false, reason: parsedForm.error });
  const form = parsedForm.form;
  const industry = String(form.get("industry") ?? "");
  const campaignDirection = String(form.get("campaignDirection") ?? "").trim();
  const ratio = String(form.get("ratio") ?? "portrait") as RatioId;
  const image = form.get("photo");
  if (!INDUSTRIES.has(industry) || !RATIOS.has(ratio) || !campaignDirection || campaignDirection.length > 40 || !(image instanceof File)) {
    return response(400, { ok: false, reason: "invalidRequest" });
  }
  const finalPrompt = buildDemoCampaignPrompt(industry as DemoIndustry, campaignDirection, ratio);
  if (!finalPrompt) return response(400, { ok: false, reason: "invalidRequest" });
  if (image.size > 10 * 1024 * 1024) return response(413, { ok: false, reason: "tooLarge" });
  const encoded = Buffer.from(await image.arrayBuffer()).toString("base64");
  const upload = decodeUpload(`data:${image.type};base64,${encoded}`);
  if (!upload.ok) return response(400, { ok: false, reason: upload.error });

  let visualReference: Awaited<ReturnType<typeof loadSushiCampaignReference>> = null;
  if (industry === "sushi") {
    try {
      visualReference = await loadSushiCampaignReference(campaignDirection);
    } catch (error) {
      console.error(JSON.stringify({
        event: "demo_campaign_reference_unavailable",
        requestId,
        industry,
        campaignDirection,
        errorName: error instanceof Error ? error.name : "UnknownError",
      }));
      return response(503, { ok: false, reason: "campaignReferenceUnavailable", requestId });
    }
    if (!visualReference) return response(400, { ok: false, reason: "invalidRequest" });
  }

  let reservation;
  try {
    reservation = await reserveDemoGeneration({
      identity,
      industry: industry as "nails" | "sushi",
      idempotencyKey,
      overrideToken: String(form.get("overrideToken") ?? "") || undefined,
    });
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error && typeof error.code === "string" ? error.code : undefined;
    console.error(JSON.stringify({ event: "demo_trial_reservation_failed", requestId, errorName: error instanceof Error ? error.name : "UnknownError", code }));
    return response(503, { ok: false, reason: "trialProtectionUnavailable", requestId });
  }
  if (!reservation.ok) return response(reservation.reason === "dailyCap" ? 429 : 403, { ok: false, reason: reservation.reason });

  try {
    // Record the exact prompt immediately before the provider call so it can be
    // compared with the generated result. Never log credentials or uploaded bytes.
    console.info(JSON.stringify({
      event: "demo_image_prompt_submitted",
      requestId,
      generationId: reservation.id,
      industry,
      campaignDirection,
      ratio,
      quality: "medium",
      imageInputs: [
        { role: "product-upload", mime: upload.mime, bytes: upload.bytes.byteLength },
        ...(visualReference ? [{ role: "campaign-style-reference", id: visualReference.id, mime: visualReference.image.mime, bytes: visualReference.image.bytes.byteLength }] : []),
      ],
      promptCharacters: finalPrompt.length,
      prompt: finalPrompt,
    }));
    const out = await openAiImageProvider.generate({
      prompt: finalPrompt,
      ratio,
      quality: "standard",
      input: upload,
      referenceImages: visualReference ? [{ id: visualReference.id, image: visualReference.image }] : undefined,
    });
    await completeDemoGeneration(reservation.id, out.costMicros);
    return response(200, { ok: true, generationId: reservation.id, quality: "medium", imageDataUrl: `data:${out.mime};base64,${out.bytes.toString("base64")}` });
  } catch (error) {
    await failDemoGeneration(reservation.id).catch(() => undefined);
    console.error(`[demo-generation ${reservation.id}]`, error instanceof Error ? error.message : "provider failure");
    return response(502, { ok: false, reason: "generationFailed" });
  }
}
