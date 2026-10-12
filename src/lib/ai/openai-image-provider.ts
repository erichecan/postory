import "server-only";
import type { Quality, RatioId } from "@/components/create/studio-options";
import { ProviderError, type GenerateInput, type GenerateOutput, type ImageProvider } from "./types";

const MODEL = "gpt-image-2.5-sunburst";
const IMAGE_API_TIMEOUT_MS = 180_000;

const SIZE_BY_RATIO: Record<RatioId, string> = {
  square: "1024x1024",
  portrait: "1024x1280",
  story: "864x1536",
  landscape: "1536x864",
};

function apiKey() {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) throw new ProviderError("failed", "OPENAI_API_KEY is not configured");
  return key;
}

function qualityFor(quality: Quality) {
  return quality === "hd" ? "high" : "medium";
}

function providerError(status: number, body: string) {
  if (status === 400 || status === 401 || status === 403 || status === 422) {
    return new ProviderError("failed", `OpenAI image request rejected (${status}): ${body.slice(0, 240)}`);
  }
  return new ProviderError("failed", `OpenAI image request failed (${status}): ${body.slice(0, 240)}`);
}

async function generate(input: GenerateInput): Promise<GenerateOutput> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), IMAGE_API_TIMEOUT_MS);
  try {
    const headers = { Authorization: `Bearer ${apiKey()}` };
    const endpoint = input.input ? "https://api.openai.com/v1/images/edits" : "https://api.openai.com/v1/images/generations";
    const body = new FormData();
    body.set("model", MODEL);
    body.set("prompt", input.prompt);
    body.set("size", SIZE_BY_RATIO[input.ratio]);
    body.set("quality", qualityFor(input.quality));
    body.set("output_format", "png");
    body.set("n", "1");
    if (input.input) {
      const imageBytes = new Uint8Array(input.input.bytes.byteLength);
      imageBytes.set(input.input.bytes);
      body.set("image", new Blob([imageBytes.buffer], { type: input.input.mime }), `reference.${input.input.mime === "image/jpeg" ? "jpg" : input.input.mime.split("/")[1]}`);
    }

    let response: Response;
    try {
      response = await fetch(endpoint, { method: "POST", headers, body, signal: controller.signal, cache: "no-store" });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") throw new ProviderError("failed", "OpenAI image request timed out");
      throw new ProviderError("failed", "OpenAI image service is unreachable");
    }
    if (!response.ok) throw providerError(response.status, await response.text());

    const result = (await response.json()) as { data?: Array<{ b64_json?: string }> };
    const encoded = result.data?.[0]?.b64_json;
    if (!encoded) throw new ProviderError("failed", "OpenAI returned no image data");
    const bytes = Buffer.from(encoded, "base64");
    if (!bytes.length || bytes.length > 20 * 1024 * 1024) throw new ProviderError("failed", "OpenAI image output is invalid or too large");

    // GPT Image 2.5 reports usage for cost reconciliation through the API response.
    // Keep the local estimate conservative until usage metering is wired into the ledger.
    const estimate = input.quality === "hd" ? 250_000 : 120_000;
    return { bytes, mime: "image/png", costMicros: estimate };
  } finally {
    clearTimeout(timer);
  }
}

export const openAiImageProvider: ImageProvider = { name: "openai", generate };
