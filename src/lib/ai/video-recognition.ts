import "server-only";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const MAX_DURATION_SECONDS = 180;
const BASE_FRAME_COUNT = 12;
const MAX_EXTRA_FRAMES = 6;
const MAX_FRAMES = BASE_FRAME_COUNT + MAX_EXTRA_FRAMES;
const VISION_MODEL = process.env.OPENAI_VIDEO_MODEL?.trim() || "gpt-6-luna";
const TRANSCRIPTION_MODEL = process.env.OPENAI_TRANSCRIPTION_MODEL?.trim() || "gpt-transcribe";
const USD_PER_MILLION_INPUT_TOKENS = 0.1;
const USD_PER_MILLION_OUTPUT_TOKENS = 0.5;
const TRANSCRIPTION_USD_PER_MINUTE = 0.0045;

type Frame = { number: number; seconds: number; bytes: Buffer; mimeType: string };
type Confidence = "high" | "medium" | "low";

export type VideoRecognitionResult = {
  themeCategory: "budget_challenge" | "store_intro" | "promotion" | "product_showcase" | "product_use" | "service_process" | "other" | "unknown";
  overview: string;
  coverageConfidence: Confidence;
  coverageNote: string;
  themes: Array<{ category: string; summary: string; confidence: Confidence }>;
  candidateGroups: Array<{
    candidateId: string;
    sampledFrameNumbers: number[];
    sameItemAcrossFrames: boolean;
    confidence: Confidence;
    individuallyProminent: boolean;
    contentPotential: "single_product" | "store_or_event_only" | "unclear";
    reason: string;
  }>;
  relationships: Array<{
    type: "same_promotion" | "budget_challenge" | "bundle" | "store_context" | "other";
    summary: string;
    candidateIds: string[];
  }>;
  opportunities: Array<{
    type: "store_or_event" | "single_product" | "bundle" | "education" | "unknown";
    summary: string;
    candidateIds: string[];
    confidence: Confidence;
    needsCustomerProductList: boolean;
  }>;
  materialAssessment: {
    status: "usable" | "limited" | "needs_more_material" | "unclear";
    storeOrEventContentPossible: boolean;
    individualProductContentPossible: boolean;
    limitations: string[];
  };
  unverifiedClaims: Array<{
    kind: "price" | "model_or_specification" | "promotion" | "availability" | "other";
    claim: string;
    source: "on_screen_text" | "spoken_audio" | "visual_inference";
  }>;
};

export type VideoRecognitionRun = {
  mediaType: "video";
  video: { durationSeconds: number; width: number; height: number; audioAvailable: boolean };
  sample: { initialFrames: number; supplementalFrames: number; totalFrames: number; sceneChangesDetected: number };
  transcript: { status: "transcribed" | "no_audio" | "failed"; text: string; audioSeconds: number; estimatedUsd: number };
  model: string;
  usage: { inputTokens: number; outputTokens: number; estimatedUsd: number };
  elapsedMs: number;
  result: VideoRecognitionResult;
  warnings: string[];
};

export type ImageRecognitionRun = Omit<VideoRecognitionRun, "video" | "mediaType"> & { mediaType: "image" };
export type MediaRecognitionRun = VideoRecognitionRun | ImageRecognitionRun;

export class VideoRecognitionError extends Error {
  constructor(public code: "ffmpeg_missing" | "video_invalid" | "video_too_long" | "provider_unavailable" | "provider_failed" | "invalid_model_output", message: string) {
    super(message);
    this.name = "VideoRecognitionError";
  }
}

const jsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["themeCategory", "overview", "coverageConfidence", "coverageNote", "themes", "candidateGroups", "relationships", "opportunities", "materialAssessment", "unverifiedClaims"],
  properties: {
    themeCategory: { type: "string", enum: ["budget_challenge", "store_intro", "promotion", "product_showcase", "product_use", "service_process", "other", "unknown"] },
    overview: { type: "string" },
    coverageConfidence: { type: "string", enum: ["high", "medium", "low"] },
    coverageNote: { type: "string" },
    themes: { type: "array", items: { type: "object", additionalProperties: false, required: ["category", "summary", "confidence"], properties: { category: { type: "string" }, summary: { type: "string" }, confidence: { type: "string", enum: ["high", "medium", "low"] } } } },
    candidateGroups: { type: "array", maxItems: 18, items: { type: "object", additionalProperties: false, required: ["candidateId", "sampledFrameNumbers", "sameItemAcrossFrames", "confidence", "individuallyProminent", "contentPotential", "reason"], properties: { candidateId: { type: "string" }, sampledFrameNumbers: { type: "array", maxItems: 18, items: { type: "integer", minimum: 1, maximum: 18 } }, sameItemAcrossFrames: { type: "boolean" }, confidence: { type: "string", enum: ["high", "medium", "low"] }, individuallyProminent: { type: "boolean" }, contentPotential: { type: "string", enum: ["single_product", "store_or_event_only", "unclear"] }, reason: { type: "string" } } } },
    relationships: { type: "array", items: { type: "object", additionalProperties: false, required: ["type", "summary", "candidateIds"], properties: { type: { type: "string", enum: ["same_promotion", "budget_challenge", "bundle", "store_context", "other"] }, summary: { type: "string" }, candidateIds: { type: "array", items: { type: "string" } } } } },
    opportunities: { type: "array", items: { type: "object", additionalProperties: false, required: ["type", "summary", "candidateIds", "confidence", "needsCustomerProductList"], properties: { type: { type: "string", enum: ["store_or_event", "single_product", "bundle", "education", "unknown"] }, summary: { type: "string" }, candidateIds: { type: "array", items: { type: "string" } }, confidence: { type: "string", enum: ["high", "medium", "low"] }, needsCustomerProductList: { type: "boolean" } } } },
    materialAssessment: { type: "object", additionalProperties: false, required: ["status", "storeOrEventContentPossible", "individualProductContentPossible", "limitations"], properties: { status: { type: "string", enum: ["usable", "limited", "needs_more_material", "unclear"] }, storeOrEventContentPossible: { type: "boolean" }, individualProductContentPossible: { type: "boolean" }, limitations: { type: "array", items: { type: "string" } } } },
    unverifiedClaims: { type: "array", items: { type: "object", additionalProperties: false, required: ["kind", "claim", "source"], properties: { kind: { type: "string", enum: ["price", "model_or_specification", "promotion", "availability", "other"] }, claim: { type: "string" }, source: { type: "string", enum: ["on_screen_text", "spoken_audio", "visual_inference"] } } } },
  },
} as const;

function apiKey() {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) throw new VideoRecognitionError("provider_unavailable", "OPENAI_API_KEY is not configured");
  return key;
}

function command(name: "ffmpeg" | "ffprobe") {
  return name === "ffmpeg" ? process.env.FFMPEG_PATH?.trim() || "ffmpeg" : process.env.FFPROBE_PATH?.trim() || "ffprobe";
}

async function extractFrames(input: string, outDir: string, duration: number): Promise<{ frames: Frame[]; sceneChanges: number }> {
  const baseTimes = Array.from({ length: BASE_FRAME_COUNT }, (_, index) => index * (duration - Math.min(1, duration / 2)) / (BASE_FRAME_COUNT - 1));
  const initial: Frame[] = [];
  for (let index = 0; index < baseTimes.length; index++) {
    const file = path.join(outDir, `frame-${String(index + 1).padStart(2, "0")}.jpg`);
    await execFileAsync(command("ffmpeg"), ["-hide_banner", "-loglevel", "error", "-ss", baseTimes[index].toFixed(3), "-i", input, "-frames:v", "1", "-vf", "scale=1024:1024:force_original_aspect_ratio=decrease", "-q:v", "3", "-y", file], { timeout: 30_000, maxBuffer: 2 * 1024 * 1024 });
    initial.push({ number: index + 1, seconds: baseTimes[index], bytes: await readFile(file), mimeType: "image/jpeg" });
  }

  let sceneTimes: number[] = [];
  try {
    const { stderr } = await execFileAsync(command("ffmpeg"), ["-hide_banner", "-i", input, "-an", "-vf", "select='gt(scene,0.30)',showinfo", "-vsync", "vfr", "-f", "null", "-"], { timeout: 90_000, maxBuffer: 8 * 1024 * 1024 });
    sceneTimes = [...stderr.matchAll(/pts_time:([0-9.]+)/g)].map((match) => Number(match[1])).filter((seconds) => Number.isFinite(seconds) && seconds > 0 && seconds < duration);
  } catch {
    sceneTimes = [];
  }

  const baseGapFor = (seconds: number) => Math.min(BASE_FRAME_COUNT - 2, Math.max(0, Math.floor((seconds / duration) * (BASE_FRAME_COUNT - 1))));
  const gapCandidates = new Map<number, number[]>();
  for (const seconds of sceneTimes) {
    if (initial.some((frame) => Math.abs(frame.seconds - seconds) < 1.5)) continue;
    const gap = baseGapFor(seconds);
    const candidates = gapCandidates.get(gap) ?? [];
    candidates.push(seconds);
    gapCandidates.set(gap, candidates);
  }
  const prioritizedGaps = [...gapCandidates.entries()].sort((a, b) => b[1].length - a[1].length);
  const supplementalTimes: number[] = [];
  for (let round = 0; round < MAX_EXTRA_FRAMES; round++) {
    const gap = prioritizedGaps[round % Math.max(1, prioritizedGaps.length)];
    if (!gap) break;
    const candidates = gap[1].filter((seconds) => !supplementalTimes.some((chosen) => Math.abs(chosen - seconds) < 1.5));
    if (!candidates.length) continue;
    supplementalTimes.push(candidates[Math.floor(candidates.length / 2)]);
  }

  const frames = [...initial];
  for (let index = 0; index < supplementalTimes.length; index++) {
    const seconds = supplementalTimes[index];
    const file = path.join(outDir, `frame-extra-${index + 1}.jpg`);
    await execFileAsync(command("ffmpeg"), ["-hide_banner", "-loglevel", "error", "-ss", seconds.toFixed(3), "-i", input, "-frames:v", "1", "-vf", "scale=1024:1024:force_original_aspect_ratio=decrease", "-q:v", "3", "-y", file], { timeout: 30_000, maxBuffer: 2 * 1024 * 1024 });
    frames.push({ number: BASE_FRAME_COUNT + index + 1, seconds, bytes: await readFile(file), mimeType: "image/jpeg" });
  }
  return { frames, sceneChanges: sceneTimes.length };
}

async function transcribeAudio(input: string, outDir: string, seconds: number): Promise<VideoRecognitionRun["transcript"]> {
  const file = path.join(outDir, "audio.mp3");
  await execFileAsync(command("ffmpeg"), ["-hide_banner", "-loglevel", "error", "-i", input, "-vn", "-ac", "1", "-ar", "16000", "-b:a", "48k", "-f", "mp3", "-y", file], { timeout: 60_000, maxBuffer: 2 * 1024 * 1024 });
  const bytes = await readFile(file);
  if (!bytes.length) return { status: "failed", text: "", audioSeconds: seconds, estimatedUsd: 0 };
  const body = new FormData();
  body.set("model", TRANSCRIPTION_MODEL);
  body.set("response_format", "json");
  body.set("file", new Blob([new Uint8Array(bytes)], { type: "audio/mpeg" }), "video-audio.mp3");
  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", { method: "POST", headers: { Authorization: `Bearer ${apiKey()}` }, body, signal: AbortSignal.timeout(120_000), cache: "no-store" });
  if (!response.ok) throw new Error(`transcription API ${response.status}`);
  const result = await response.json() as { text?: string };
  return { status: "transcribed", text: String(result.text ?? "").slice(0, 8_000), audioSeconds: seconds, estimatedUsd: seconds / 60 * TRANSCRIPTION_USD_PER_MINUTE };
}

function extractText(response: unknown): string {
  if (!response || typeof response !== "object" || !("output" in response) || !Array.isArray(response.output)) return "";
  for (const item of response.output) {
    if (!item || typeof item !== "object" || !("content" in item) || !Array.isArray(item.content)) continue;
    for (const content of item.content) if (content && typeof content === "object" && "type" in content && content.type === "output_text" && "text" in content && typeof content.text === "string") return content.text;
  }
  return "";
}

async function analyzeFrames(frames: Frame[], customerDescription: string, customerFacts: string, transcript: string) {
  const prompt = [
    "Analyze this customer-provided retail/service video for an internal PoStory content workflow.",
    "The uploader description can be vague or wrong. Treat it only as a hint, never as proof of object identity or factual claims.",
    "Visual samples are provided in numbered order. For a video they are selected moments across the clip; for a still image, that image is the only view of the asset. Do not infer unseen scenes.",
    "Find the overall marketing theme, noteworthy product candidates, relations such as a shared sale/budget/bundle, and content opportunities.",
    "Each candidate group must represent exactly one physically distinct product or one clearly repeated instance of the same product. Never put several different pieces of furniture/appliances/products into one catch-all candidate just because they share a category or video segment.",
    "Merge across frames only when there is strong evidence that it is the exact same product; set sameItemAcrossFrames=true only in that case. If you cannot tell whether two shown items are identical, set sameItemAcrossFrames=false and separate them into one-frame candidates. Keep different models/options separate. A set is represented as separate candidates connected by a bundle relationship, never as one candidate group.",
    "Do not promote shelves, clutter, or background items to content candidates. Include a product candidate only when it is clearly shown, repeatedly visible, or explicitly featured in speech/text.",
    "Never state product names, brands, model numbers, prices, currencies, specifications, stock, or offer terms as verified facts. Flag claims read from overlay text or speech as unverified.",
    "Never infer USD/CAD from the store location or language. If the speaker says '刀' or 'dollars' without specifying a currency, preserve the ambiguity and say the currency is unconfirmed; do not translate it to US dollars. Do not put a currency name in the overview or theme summaries unless it is explicitly stated.",
    "Use generic IDs like candidate-1, not guessed names. Do not output visual feature descriptions in any text field.",
    "A specific item post needs a customer-provided menu, price list, or product list. Without one, prefer store/event content or mark the item opportunity as needing that list.",
    `Uploader description (unverified hint): ${customerDescription || "(none)"}`,
    `Customer-provided product/menu facts (not independently verified): ${customerFacts || "(none)"}`,
    `Speech transcript (may be inaccurate and is not proof): ${transcript || "(no transcript)"}`,
    `The only valid sample frame numbers are: ${frames.map((frame) => frame.number).join(", ")}. Each candidate's sampledFrameNumbers must use only these numbers and group only identical items.`,
    "Return conservative, useful results. Keep summaries brief and in the language used by the customer materials.",
  ].join("\n\n");
  const content: Array<Record<string, unknown>> = [{ type: "input_text", text: prompt }];
  for (const frame of frames) {
    content.push({ type: "input_text", text: `Sample frame number ${frame.number}.` });
    content.push({ type: "input_image", image_url: `data:${frame.mimeType};base64,${frame.bytes.toString("base64")}`, detail: "high" });
  }
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey()}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: VISION_MODEL,
      reasoning: { effort: "none" },
      input: [{ role: "user", content }],
      text: { format: { type: "json_schema", name: "postory_video_analysis", strict: true, schema: jsonSchema } },
      max_output_tokens: 5000,
      store: false,
    }),
    signal: AbortSignal.timeout(180_000),
    cache: "no-store",
  });
  if (!response.ok) throw new VideoRecognitionError("provider_failed", `Vision API returned ${response.status}`);
  const body = await response.json() as { output?: unknown[]; usage?: { input_tokens?: number; output_tokens?: number }; status?: string; incomplete_details?: unknown };
  if (body.status === "incomplete") throw new VideoRecognitionError("invalid_model_output", "Vision response was incomplete");
  const text = extractText(body);
  if (!text) throw new VideoRecognitionError("invalid_model_output", "Vision response did not contain structured output");
  let result: VideoRecognitionResult;
  try { result = JSON.parse(text) as VideoRecognitionResult; } catch { throw new VideoRecognitionError("invalid_model_output", "Vision response JSON could not be parsed"); }
  let invalidFrameReference = false;
  const candidateExpansions = new Map<string, string[]>();
  const candidateGroups: VideoRecognitionResult["candidateGroups"] = [];
  for (const candidate of result.candidateGroups) {
    const valid = candidate.sampledFrameNumbers.filter((number) => Number.isInteger(number) && number >= 1 && number <= Math.min(frames.length, MAX_FRAMES));
    if (valid.length !== candidate.sampledFrameNumbers.length) invalidFrameReference = true;
    const unique = [...new Set(valid)];
    const uncertainIdentity = /cannot (?:confirm|tell).*(?:same|identical)|unclear whether.*same|无法确认.*同一|不确定.*同一|无法判断.*同一|不能确认.*同一/i.test(candidate.reason);
    if (unique.length > 1 && (!candidate.sameItemAcrossFrames || uncertainIdentity)) {
      const ids = unique.map((_, index) => `${candidate.candidateId}-${index + 1}`);
      candidateExpansions.set(candidate.candidateId, ids);
      for (const [index, frameNumber] of unique.entries()) candidateGroups.push({
        ...candidate,
        candidateId: ids[index],
        sampledFrameNumbers: [frameNumber],
        sameItemAcrossFrames: false,
        confidence: "low",
        contentPotential: candidate.contentPotential === "store_or_event_only" ? "store_or_event_only" : "unclear",
        reason: "模型不能确认这些画面是否为同一商品，已拆为独立候选，需先核对商品清单。",
      });
    } else {
      candidateExpansions.set(candidate.candidateId, [candidate.candidateId]);
      candidateGroups.push({ ...candidate, sampledFrameNumbers: unique });
    }
  }
  result.candidateGroups = candidateGroups;
  for (const relationship of result.relationships) relationship.candidateIds = relationship.candidateIds.flatMap((id) => candidateExpansions.get(id) ?? [id]);
  for (const opportunity of result.opportunities) opportunity.candidateIds = opportunity.candidateIds.flatMap((id) => candidateExpansions.get(id) ?? [id]);
  const inputTokens = Number(body.usage?.input_tokens ?? 0);
  const outputTokens = Number(body.usage?.output_tokens ?? 0);
  return { result, inputTokens, outputTokens, usd: inputTokens / 1_000_000 * USD_PER_MILLION_INPUT_TOKENS + outputTokens / 1_000_000 * USD_PER_MILLION_OUTPUT_TOKENS, invalidFrameReference };
}

export async function recognizeVideo(input: { videoBytes: Buffer; extension: string; customerDescription: string; customerFacts: string }): Promise<VideoRecognitionRun> {
  const startedAt = Date.now();
  const apiSecret = apiKey();
  if (!apiSecret) throw new VideoRecognitionError("provider_unavailable", "OpenAI is not configured");
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "postory-video-lab-"));
  const videoPath = path.join(tempRoot, `upload.${input.extension}`);
  const warnings: string[] = [];
  try {
    await writeFile(videoPath, input.videoBytes);
    const { stdout } = await execFileAsync(command("ffprobe"), ["-v", "error", "-show_streams", "-show_format", "-of", "json", videoPath], { timeout: 30_000, maxBuffer: 2 * 1024 * 1024 }).catch((error: unknown) => {
      const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
      if (code === "ENOENT") throw new VideoRecognitionError("ffmpeg_missing", "ffprobe/ffmpeg is not installed");
      throw new VideoRecognitionError("video_invalid", "Video could not be read");
    });
    const probe = JSON.parse(stdout) as { streams?: Array<{ codec_type?: string; width?: number; height?: number }>; format?: { duration?: string } };
    const videoStream = probe.streams?.find((stream) => stream.codec_type === "video");
    const durationSeconds = Number(probe.format?.duration ?? 0);
    if (!videoStream || !Number.isFinite(durationSeconds) || durationSeconds <= 0) throw new VideoRecognitionError("video_invalid", "No usable video stream was found");
    if (durationSeconds > MAX_DURATION_SECONDS) throw new VideoRecognitionError("video_too_long", "Each test clip must be 180 seconds or shorter");
    const width = Number(videoStream.width ?? 0);
    const height = Number(videoStream.height ?? 0);
    const audioAvailable = probe.streams?.some((stream) => stream.codec_type === "audio") ?? false;

    const extracted = await extractFrames(videoPath, tempRoot, durationSeconds);
    let transcript: VideoRecognitionRun["transcript"] = { status: "no_audio", text: "", audioSeconds: 0, estimatedUsd: 0 };
    if (audioAvailable) {
      try { transcript = await transcribeAudio(videoPath, tempRoot, durationSeconds); }
      catch { transcript = { status: "failed", text: "", audioSeconds: durationSeconds, estimatedUsd: 0 }; warnings.push("Speech transcription failed; visual analysis continued without transcript."); }
    }
    const analyzed = await analyzeFrames(extracted.frames, input.customerDescription, input.customerFacts, transcript.text);
    if (analyzed.invalidFrameReference) warnings.push("The model returned out-of-range sample references; invalid references were removed.");
    return {
      mediaType: "video",
      video: { durationSeconds, width, height, audioAvailable },
      sample: { initialFrames: BASE_FRAME_COUNT, supplementalFrames: extracted.frames.length - BASE_FRAME_COUNT, totalFrames: extracted.frames.length, sceneChangesDetected: extracted.sceneChanges },
      transcript,
      model: VISION_MODEL,
      usage: { inputTokens: analyzed.inputTokens, outputTokens: analyzed.outputTokens, estimatedUsd: analyzed.usd + transcript.estimatedUsd },
      elapsedMs: Date.now() - startedAt,
      result: analyzed.result,
      warnings,
    };
  } finally {
    await rm(tempRoot, { recursive: true, force: true }).catch(() => undefined);
  }
}

export async function recognizeImage(input: { imageBytes: Buffer; mimeType: string; customerDescription: string; customerFacts: string }): Promise<ImageRecognitionRun> {
  const startedAt = Date.now();
  apiKey();
  const analyzed = await analyzeFrames(
    [{ number: 1, seconds: 0, bytes: input.imageBytes, mimeType: input.mimeType }],
    input.customerDescription,
    input.customerFacts,
    "",
  );
  return {
    mediaType: "image",
    sample: { initialFrames: 1, supplementalFrames: 0, totalFrames: 1, sceneChangesDetected: 0 },
    transcript: { status: "no_audio", text: "", audioSeconds: 0, estimatedUsd: 0 },
    model: VISION_MODEL,
    usage: { inputTokens: analyzed.inputTokens, outputTokens: analyzed.outputTokens, estimatedUsd: analyzed.usd },
    elapsedMs: Date.now() - startedAt,
    result: analyzed.result,
    warnings: analyzed.invalidFrameReference ? ["The model returned out-of-range sample references; invalid references were removed."] : [],
  };
}
