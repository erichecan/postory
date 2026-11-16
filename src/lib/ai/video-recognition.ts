import "server-only";
import { execFile, spawn } from "node:child_process";
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

type Frame = { number: number; seconds: number; bytes: Buffer; filePath: string; mimeType?: string };
type Confidence = "high" | "medium" | "low";

export type VideoRecognitionResult = {
  themeCategory: "budget_challenge" | "store_intro" | "promotion" | "product_showcase" | "product_use" | "service_process" | "other" | "unknown";
  overview: string;
  coverageConfidence: Confidence;
  coverageNote: string;
  themes: Array<{ category: string; summary: string; confidence: Confidence }>;
  candidateGroups: Array<{
    candidateId: string;
    displayName: string;
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
  mediaType: "video" | "image";
  video: { durationSeconds: number; width: number; height: number; audioAvailable: boolean };
  sample: { initialFrames: number; supplementalFrames: number; totalFrames: number; sceneChangesDetected: number };
  transcript: { status: "transcribed" | "no_audio" | "failed" | "skipped"; text: string; audioSeconds: number; estimatedUsd: number };
  provider: "openai_api" | "codex_cli";
  framePreviews: Array<{ number: number; dataUrl: string }>;
  model: string;
  usage: { inputTokens: number; outputTokens: number; estimatedUsd: number | null };
  elapsedMs: number;
  result: VideoRecognitionResult;
  warnings: string[];
};

export class VideoRecognitionError extends Error {
  constructor(public code: "ffmpeg_missing" | "video_invalid" | "video_too_long" | "image_invalid" | "provider_unavailable" | "provider_failed" | "invalid_model_output" | "codex_unavailable" | "codex_not_logged_in" | "codex_failed", message: string) {
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
    candidateGroups: { type: "array", maxItems: 18, items: { type: "object", additionalProperties: false, required: ["candidateId", "displayName", "sampledFrameNumbers", "sameItemAcrossFrames", "confidence", "individuallyProminent", "contentPotential", "reason"], properties: { candidateId: { type: "string" }, displayName: { type: "string" }, sampledFrameNumbers: { type: "array", maxItems: 18, items: { type: "integer", minimum: 1, maximum: 18 } }, sameItemAcrossFrames: { type: "boolean" }, confidence: { type: "string", enum: ["high", "medium", "low"] }, individuallyProminent: { type: "boolean" }, contentPotential: { type: "string", enum: ["single_product", "store_or_event_only", "unclear"] }, reason: { type: "string" } } } },
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
    initial.push({ number: index + 1, seconds: baseTimes[index], bytes: await readFile(file), filePath: file, mimeType: "image/jpeg" });
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
    frames.push({ number: BASE_FRAME_COUNT + index + 1, seconds, bytes: await readFile(file), filePath: file, mimeType: "image/jpeg" });
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

function buildAnalysisPrompt(frames: Frame[], customerDescription: string, customerFacts: string, transcript: string, mediaType: "video" | "image" = "video") {
  const isImage = mediaType === "image";
  return [
    isImage ? "Analyze this customer-provided retail/service image for an internal PoStory content workflow." : "Analyze this customer-provided retail/service video for an internal PoStory content workflow.",
    "The uploader description can be vague or wrong. Treat it only as a hint, never as proof of object identity or factual claims.",
    isImage ? "This is one still image. Describe only what is visible in the image; do not infer motion, preparation steps, other views, or unseen scenes." : "Images are samples from the whole clip, ordered by internal frame number. Do not infer unseen scenes.",
    "Find the overall marketing theme, noteworthy product candidates, relations such as a shared sale/budget/bundle, and content opportunities.",
    isImage ? "Classify the main purpose of this image. Use product_showcase for a clearly featured item, store_intro for a venue or interior, and promotion only when an offer is visibly stated or provided by the customer. Do not infer a use process from a still image." : "Classify the dominant purpose of the whole clip, not an isolated action. Choose product_use only when the clip primarily demonstrates how to operate or use a product, or shows a use process. A host handling products while presenting a retail sale, promotion, or Black Friday offer is promotion; mainly presenting products without an offer is product_showcase.",
    "Candidates represent distinct product listings for marketing, not each physical unit in a shop. Group multiple units of the same product category/model shown together (for example, a row of treadmills) into ONE candidate, even if they are physically separate machines. Split same-category items only when the video clearly shows meaningfully different models/options that should be marketed separately. Never put different product categories into one catch-all candidate.",
    "sameItemAcrossFrames describes whether the exact physical unit is confirmed across frames; set it true only with strong evidence. If physical identity is uncertain, keep it false, but do not create duplicate marketing candidates just because the same product category appears in multiple frames. Keep clearly different models/options separate. A bundle of different product categories is represented as separate candidates connected by a bundle relationship.",
    "Do not promote shelves, clutter, or background items to content candidates. Include a product candidate only when it is clearly shown, repeatedly visible, or explicitly featured in speech/text. If several instances of the same product category are visible in one scene, describe them as one product candidate and note that multiple units are shown.",
    "Never state product names, brands, model numbers, prices, currencies, specifications, stock, or offer terms as verified facts. Flag claims read from overlay text or speech as unverified.",
    "Never infer USD/CAD from the store location or language. If the speaker says '刀' or 'dollars' without specifying a currency, preserve the ambiguity and say the currency is unconfirmed; do not translate it to US dollars. Do not put a currency name in the overview or theme summaries unless it is explicitly stated.",
    "Use generic IDs like candidate-1, not guessed brand/model names. Give each candidate a short displayName for its recognizable product category (for example, massage chair, refrigerator, or office chair); use 'Unclear product' if uncertain. Do not output visual feature descriptions in any text field.",
    "A specific item post needs a customer-provided menu, price list, or product list. Without one, prefer store/event content or mark the item opportunity as needing that list.",
    `Uploader description (unverified hint): ${customerDescription || "(none)"}`,
    `Customer-provided product/menu facts (not independently verified): ${customerFacts || "(none)"}`,
    `Speech transcript (may be inaccurate and is not proof): ${transcript || "(not transcribed in local Codex mode)"}`,
    `The only valid sample ${isImage ? "image" : "frame"} numbers are: ${frames.map((frame) => frame.number).join(", ")}. Each candidate's sampledFrameNumbers must use only these numbers. Group repeated units of the same category/model as one marketing candidate; use separate candidates for distinct categories or clearly different models.`,
    "Return conservative, useful results. Keep summaries brief and in the language used by the customer materials.",
  ].join("\n\n");
}

type NormalizedAnalysis = {
  result: VideoRecognitionResult;
  inputTokens: number;
  outputTokens: number;
  usd: number | null;
  invalidFrameReference: boolean;
};

function normalizeAnalysis(text: string, frames: Frame[], inputTokens: number, outputTokens: number, usd: number | null): NormalizedAnalysis {
  let result: VideoRecognitionResult;
  try { result = JSON.parse(text) as VideoRecognitionResult; } catch { throw new VideoRecognitionError("invalid_model_output", "Vision response JSON could not be parsed"); }
  if (!result || !Array.isArray(result.candidateGroups) || !Array.isArray(result.relationships) || !Array.isArray(result.opportunities)) {
    throw new VideoRecognitionError("invalid_model_output", "Vision response did not match the required result structure");
  }
  let invalidFrameReference = false;
  const candidateExpansions = new Map<string, string[]>();
  const candidateGroups: VideoRecognitionResult["candidateGroups"] = [];
  for (const candidate of result.candidateGroups) {
    const valid = candidate.sampledFrameNumbers.filter((number) => Number.isInteger(number) && number >= 1 && number <= Math.min(frames.length, MAX_FRAMES));
    if (valid.length !== candidate.sampledFrameNumbers.length) invalidFrameReference = true;
    const unique = [...new Set(valid)];
    candidateExpansions.set(candidate.candidateId, [candidate.candidateId]);
    candidateGroups.push({ ...candidate, sampledFrameNumbers: unique });
  }
  const canonicalIds = new Map<string, string>();
  const mergedByProduct = new Map<string, VideoRecognitionResult["candidateGroups"][number]>();
  const uniqueCandidateGroups: VideoRecognitionResult["candidateGroups"] = [];
  for (const candidate of candidateGroups) {
    const normalizedName = candidate.displayName.trim().toLocaleLowerCase().replace(/\s+/g, " ");
    const distinctVariant = /different (?:models?|versions?|options?)|distinct models?|separate models?|不同型号|不同款式|不同版本|不同配置/i.test(candidate.reason);
    const canMerge = candidate.contentPotential === "single_product" && !distinctVariant && normalizedName.length > 0 && !["unclear product", "unknown product", "不明商品", "未知商品"].includes(normalizedName);
    const existing = canMerge ? mergedByProduct.get(normalizedName) : undefined;
    if (!existing) {
      uniqueCandidateGroups.push(candidate);
      canonicalIds.set(candidate.candidateId, candidate.candidateId);
      if (canMerge) mergedByProduct.set(normalizedName, candidate);
      continue;
    }
    canonicalIds.set(candidate.candidateId, existing.candidateId);
    existing.sampledFrameNumbers = [...new Set([...existing.sampledFrameNumbers, ...candidate.sampledFrameNumbers])];
    existing.individuallyProminent ||= candidate.individuallyProminent;
    existing.sameItemAcrossFrames &&= candidate.sameItemAcrossFrames;
    if (["high", "medium", "low"].indexOf(candidate.confidence) < ["high", "medium", "low"].indexOf(existing.confidence)) existing.confidence = candidate.confidence;
  }
  const expandCanonicalIds = (id: string) => [...new Set((candidateExpansions.get(id) ?? [id]).map((expandedId) => canonicalIds.get(expandedId) ?? expandedId))];
  result.candidateGroups = uniqueCandidateGroups;
  for (const relationship of result.relationships) relationship.candidateIds = [...new Set(relationship.candidateIds.flatMap(expandCanonicalIds))];
  for (const opportunity of result.opportunities) opportunity.candidateIds = [...new Set(opportunity.candidateIds.flatMap(expandCanonicalIds))];
  return { result, inputTokens, outputTokens, usd, invalidFrameReference };
}

async function analyzeFrames(frames: Frame[], customerDescription: string, customerFacts: string, transcript: string, mediaType: "video" | "image" = "video") {
  const prompt = buildAnalysisPrompt(frames, customerDescription, customerFacts, transcript, mediaType);
  const content: Array<Record<string, unknown>> = [{ type: "input_text", text: prompt }];
  for (const frame of frames) {
    content.push({ type: "input_text", text: `Sample ${mediaType === "image" ? "image" : "frame"} number ${frame.number}.` });
    content.push({ type: "input_image", image_url: `data:${frame.mimeType ?? "image/jpeg"};base64,${frame.bytes.toString("base64")}`, detail: "high" });
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
  const inputTokens = Number(body.usage?.input_tokens ?? 0);
  const outputTokens = Number(body.usage?.output_tokens ?? 0);
  return normalizeAnalysis(text, frames, inputTokens, outputTokens, inputTokens / 1_000_000 * USD_PER_MILLION_INPUT_TOKENS + outputTokens / 1_000_000 * USD_PER_MILLION_OUTPUT_TOKENS);
}

function isLocalCodexMode() {
  return process.env.NODE_ENV === "development" && process.env.VIDEO_RECOGNITION_PROVIDER === "codex_cli";
}

function runCodex(args: string[], prompt: string, cwd: string, env: NodeJS.ProcessEnv): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.env.CODEX_CLI_PATH?.trim() || "codex", args, { cwd, env, stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => child.kill("SIGTERM"), 270_000);
    child.stdout.setEncoding("utf8").on("data", (chunk: string) => { stdout += chunk; });
    child.stderr.setEncoding("utf8").on("data", (chunk: string) => { stderr += chunk; });
    child.on("error", (error) => { clearTimeout(timer); reject(new VideoRecognitionError("codex_unavailable", error.message)); });
    child.on("close", (code, signal) => {
      clearTimeout(timer);
      if (code === 0) resolve(stdout);
      else reject(new VideoRecognitionError("codex_failed", signal === "SIGTERM" ? "Codex CLI timed out after 270 seconds" : `Codex CLI exited ${code}: ${stderr.slice(-1500)}`));
    });
    child.stdin.end(prompt);
  });
}

async function analyzeFramesWithCodex(frames: Frame[], customerDescription: string, customerFacts: string, mediaType: "video" | "image" = "video") {
  const env = { ...process.env };
  for (const key of ["OPENAI_API_KEY", "OPENAI_BASE_URL", "CODEX_ACCESS_TOKEN", "CODEX_API_KEY"]) delete env[key];
  await new Promise<void>((resolve, reject) => execFile(process.env.CODEX_CLI_PATH?.trim() || "codex", ["login", "status"], { env, timeout: 15_000, maxBuffer: 64 * 1024 }, (error, stdout, stderr) => {
    if (error) return reject(new VideoRecognitionError("codex_unavailable", `Codex CLI login check failed: ${String(stderr || error.message).slice(-500)}`));
    if (!/logged in using chatgpt/i.test(`${stdout}\n${stderr}`)) return reject(new VideoRecognitionError("codex_not_logged_in", "Codex CLI is not logged in with a ChatGPT account"));
    resolve();
  }));
  const outDir = path.dirname(frames[0].filePath);
  const schemaPath = path.join(outDir, "analysis-schema.json");
  const outputPath = path.join(outDir, "analysis-result.json");
  await writeFile(schemaPath, JSON.stringify(jsonSchema));
  const args = ["exec", "--ephemeral", "--skip-git-repo-check", "--sandbox", "read-only", "--json", "--output-schema", schemaPath, "--output-last-message", outputPath];
  for (const frame of frames) args.push("--image", frame.filePath);
  args.push("-");
  const stdout = await runCodex(args, buildAnalysisPrompt(frames, customerDescription, customerFacts, "", mediaType), outDir, env);
  let inputTokens = 0;
  let outputTokens = 0;
  for (const line of stdout.split(/\r?\n/)) {
    try {
      const event = JSON.parse(line) as { type?: string; usage?: { input_tokens?: number; output_tokens?: number } };
      if (event.type === "turn.completed") {
        inputTokens = Number(event.usage?.input_tokens ?? inputTokens);
        outputTokens = Number(event.usage?.output_tokens ?? outputTokens);
      }
    } catch { /* Ignore non-JSON diagnostics. */ }
  }
  let text: string;
  try { text = await readFile(outputPath, "utf8"); }
  catch { throw new VideoRecognitionError("invalid_model_output", "Codex CLI did not save its structured result"); }
  return normalizeAnalysis(text, frames, inputTokens, outputTokens, null);
}

export async function recognizeVideo(input: { videoBytes: Buffer; extension: string; customerDescription: string; customerFacts: string }): Promise<VideoRecognitionRun> {
  const startedAt = Date.now();
  const useCodex = isLocalCodexMode();
  if (!useCodex) apiKey();
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
    let transcript: VideoRecognitionRun["transcript"] = { status: useCodex ? "skipped" : "no_audio", text: "", audioSeconds: 0, estimatedUsd: 0 };
    if (audioAvailable && !useCodex) {
      try { transcript = await transcribeAudio(videoPath, tempRoot, durationSeconds); }
      catch { transcript = { status: "failed", text: "", audioSeconds: durationSeconds, estimatedUsd: 0 }; warnings.push("Speech transcription failed; visual analysis continued without transcript."); }
    }
    const analyzed = useCodex ? await analyzeFramesWithCodex(extracted.frames, input.customerDescription, input.customerFacts) : await analyzeFrames(extracted.frames, input.customerDescription, input.customerFacts, transcript.text);
    if (analyzed.invalidFrameReference) warnings.push("The model returned out-of-range sample references; invalid references were removed.");
    return {
      mediaType: "video",
      video: { durationSeconds, width, height, audioAvailable },
      sample: { initialFrames: BASE_FRAME_COUNT, supplementalFrames: extracted.frames.length - BASE_FRAME_COUNT, totalFrames: extracted.frames.length, sceneChangesDetected: extracted.sceneChanges },
      transcript,
      provider: useCodex ? "codex_cli" : "openai_api",
      framePreviews: [...new Set(analyzed.result.candidateGroups.flatMap((candidate) => candidate.sampledFrameNumbers.slice(0, 1)))]
        .map((number) => extracted.frames.find((frame) => frame.number === number))
        .filter((frame): frame is Frame => Boolean(frame))
        .map((frame) => ({ number: frame.number, dataUrl: `data:${frame.mimeType ?? "image/jpeg"};base64,${frame.bytes.toString("base64")}` })),
      model: useCodex ? "Codex CLI (local account)" : VISION_MODEL,
      usage: { inputTokens: analyzed.inputTokens, outputTokens: analyzed.outputTokens, estimatedUsd: analyzed.usd === null ? null : analyzed.usd + transcript.estimatedUsd },
      elapsedMs: Date.now() - startedAt,
      result: analyzed.result,
      warnings,
    };
  } finally {
    await rm(tempRoot, { recursive: true, force: true }).catch(() => undefined);
  }
}

export async function recognizeImage(input: { imageBytes: Buffer; extension: string; mimeType: string; customerDescription: string; customerFacts: string }): Promise<VideoRecognitionRun> {
  const startedAt = Date.now();
  const useCodex = isLocalCodexMode();
  if (!useCodex) apiKey();
  if (!["image/jpeg", "image/png", "image/webp"].includes(input.mimeType)) throw new VideoRecognitionError("image_invalid", "Only JPEG, PNG, and WebP images are supported");
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "postory-image-lab-"));
  const imagePath = path.join(tempRoot, `upload.${input.extension}`);
  try {
    await writeFile(imagePath, input.imageBytes);
    const { stdout } = await execFileAsync(command("ffprobe"), ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "json", imagePath], { timeout: 30_000, maxBuffer: 1024 * 1024 }).catch((error: unknown) => {
      const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
      if (code === "ENOENT") throw new VideoRecognitionError("ffmpeg_missing", "ffprobe/ffmpeg is not installed");
      throw new VideoRecognitionError("image_invalid", "Image could not be read");
    });
    const probe = JSON.parse(stdout) as { streams?: Array<{ width?: number; height?: number }> };
    const stream = probe.streams?.[0];
    const width = Number(stream?.width ?? 0);
    const height = Number(stream?.height ?? 0);
    if (!width || !height || width * height > 80_000_000) throw new VideoRecognitionError("image_invalid", "Image dimensions are invalid or too large");
    const previewExtension = input.mimeType === "image/jpeg" ? "jpg" : "png";
    const previewMimeType = previewExtension === "jpg" ? "image/jpeg" : "image/png";
    const previewPath = path.join(tempRoot, `preview.${previewExtension}`);
    await execFileAsync(command("ffmpeg"), ["-hide_banner", "-loglevel", "error", "-i", imagePath, "-frames:v", "1", "-vf", "scale=1600:1600:force_original_aspect_ratio=decrease", "-q:v", "4", "-y", previewPath], { timeout: 60_000, maxBuffer: 1024 * 1024 }).catch((error: unknown) => {
      const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
      if (code === "ENOENT") throw new VideoRecognitionError("ffmpeg_missing", "ffprobe/ffmpeg is not installed");
      throw new VideoRecognitionError("image_invalid", "Image could not be normalized");
    });
    const previewBytes = await readFile(previewPath);
    const frame: Frame = { number: 1, seconds: 0, bytes: previewBytes, filePath: previewPath, mimeType: previewMimeType };
    const analyzed = useCodex
      ? await analyzeFramesWithCodex([frame], input.customerDescription, input.customerFacts, "image")
      : await analyzeFrames([frame], input.customerDescription, input.customerFacts, "", "image");
    const warnings = analyzed.invalidFrameReference ? ["The model returned out-of-range sample references; invalid references were removed."] : [];
    return {
      mediaType: "image",
      video: { durationSeconds: 0, width, height, audioAvailable: false },
      sample: { initialFrames: 1, supplementalFrames: 0, totalFrames: 1, sceneChangesDetected: 0 },
      transcript: { status: "no_audio", text: "", audioSeconds: 0, estimatedUsd: 0 },
      provider: useCodex ? "codex_cli" : "openai_api",
      framePreviews: [{ number: 1, dataUrl: `data:${previewMimeType};base64,${previewBytes.toString("base64")}` }],
      model: useCodex ? "Codex CLI (local account)" : VISION_MODEL,
      usage: { inputTokens: analyzed.inputTokens, outputTokens: analyzed.outputTokens, estimatedUsd: analyzed.usd },
      elapsedMs: Date.now() - startedAt,
      result: analyzed.result,
      warnings,
    };
  } finally {
    await rm(tempRoot, { recursive: true, force: true }).catch(() => undefined);
  }
}
