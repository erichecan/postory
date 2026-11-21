import { execFile, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, readdir, rm, stat, copyFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import type { NextRequest } from "next/server";
import { openAiImageProvider } from "@/lib/ai/openai-image-provider";
import { ProviderError } from "@/lib/ai/types";
import { getObject, marketingImageCacheKey, publicMediaUrl, putObject } from "@/lib/storage";
export const runtime = "nodejs";
export const maxDuration = 300;
const execFileAsync = promisify(execFile); const LIMITS = new Map<string, number[]>();
const IMAGE_RULES: Record<string, string> = {
  "餐馆": "Restaurant-ad art direction: the named dish or supplied food photo is the unmistakable hero, photographed close enough to show fresh texture and appetizing detail; use natural directional light, believable plating, and a real dining/table context. Avoid generic empty restaurant interiors when the post sells a dish. Keep food realistic and do not invent ingredients, portion size, or food claims.",
  "美甲／美容": "Beauty-service campaign art direction: show the actual service result, nail design, treatment detail, or calm studio moment that matches the post; use clean editorial lighting, precise detail, and an elegant palette. Do not imply medical treatment, guarantee results, or fabricate a client before/after.",
  "零售店": "Retail-ad art direction: make the named item or supplied product photo the dominant hero; preserve its real shape, color, and visible design, and show a useful real-life scale or styling context. Avoid invented labels, brand marks, stock, and discounts.",
  "健身／健康": "Fitness/wellness campaign art direction: show an authentic class, equipment, coach, or welcoming studio moment, with an energetic but credible composition. Avoid body transformation claims, medical imagery, and guaranteed outcomes.",
  "家居服务": "Home-service campaign art direction: show a believable service visit, tools, material detail, or a space being worked on; use clear before/during/after context only when supported by supplied imagery. Do not invent certifications, project results, or warranty claims.",
  "其他本地商家": "Local-business campaign art direction: show the specific service or customer use moment from the post as the hero, with a believable neighborhood setting and polished commercial photography. Do not invent claims, credentials, people, or results.",
};
const PLATFORM_RULES: Record<string, string> = {
  Instagram: "square feed ad composition; bold close crop, visually arresting hero, simple color story, readable lower safe area for a short headline and action overlay",
  Facebook: "portrait feed ad composition; communicate the offer or visit reason at a glance, keep the subject large and central, leave a clean lower safe area for a headline and action overlay",
  TikTok: "vertical 9:16 short-video cover style; close, lively point of view, strong foreground, immediate visual hook in the top half, keep the lower interface-safe area uncluttered",
  "小红书": "vertical portrait lifestyle-editorial ad composition; useful real-life context, tactile close detail, warm natural light, premium but believable, leave a clean lower area for a short title overlay",
};
function json(status: number, body: Record<string, unknown>) { return Response.json(body, { status, headers: { "Cache-Control": "no-store, private" } }); }
function limited(request: NextRequest) { const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"; const now = Date.now(); const recent = (LIMITS.get(ip) ?? []).filter((time) => now - time < 3600000); if (recent.length >= 60) return true; recent.push(now); if (LIMITS.size > 10000) LIMITS.clear(); LIMITS.set(ip, recent); return false; }
async function codexImage(prompt: string, output: string, dir: string, inputPath?: string) {
  const env = { ...process.env }; for (const key of ["OPENAI_API_KEY", "OPENAI_BASE_URL", "CODEX_ACCESS_TOKEN", "CODEX_API_KEY"]) delete env[key];
  const exe = process.env.CODEX_CLI_PATH?.trim() || "codex"; const status = await execFileAsync(exe, ["login", "status"], { env, timeout: 15000 }).catch(() => { throw new Error("codex_not_logged_in"); });
  if (!/logged in using chatgpt/i.test(`${status.stdout}\n${status.stderr}`)) throw new Error("codex_not_logged_in");
  const start = Date.now(); let logs = "";
  await new Promise<void>((resolve, reject) => { const args = ["exec", "--ephemeral", "--skip-git-repo-check", "--sandbox", "workspace-write", "-C", dir]; if (inputPath) args.push("-i", inputPath); args.push("--", `${prompt}\nUse the imagegen skill exactly once and save the result to ${output}.`); const child = spawn(exe, args, { cwd: dir, env, stdio: ["ignore", "pipe", "pipe"] }); const timer = setTimeout(() => child.kill("SIGTERM"), 270000); child.stdout.on("data", (part: Buffer) => { logs = (logs + part.toString()).slice(-1500); }); child.stderr.on("data", (part: Buffer) => { logs = (logs + part.toString()).slice(-1500); }); child.on("error", () => { clearTimeout(timer); reject(new Error("codex_unavailable")); }); child.on("close", (code, signal) => { clearTimeout(timer); if (code === 0) resolve(); else reject(new Error(signal === "SIGTERM" ? "codex_timeout" : "codex_failed")); }); });
  try { await stat(output); } catch { const session = logs.match(/session id:\s*([a-f0-9-]{30,40})/i)?.[1]; if (session) { const folder = path.join(process.env.CODEX_HOME?.trim() || path.join(os.homedir(), ".codex"), "generated_images", session); try { const list = await readdir(folder); const candidates = await Promise.all(list.filter((name) => /\.(png|jpe?g|webp)$/i.test(name)).map(async (name) => ({ p: path.join(folder, name), m: (await stat(path.join(folder, name))).mtimeMs }))); const latest = candidates.filter((item) => item.m > start - 2000).sort((a, b) => b.m - a.m)[0]; if (latest) await copyFile(latest.p, output); } catch { /* image tool may not save */ } await rm(folder, { recursive: true, force: true }).catch(() => undefined); } }
  const bytes = await readFile(output).catch(() => { throw new Error("codex_no_image"); }); const png = bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])); const jpg = bytes[0] === 255 && bytes[1] === 216; const webp = bytes.subarray(0,4).toString() === "RIFF" && bytes.subarray(8,12).toString() === "WEBP"; if (!png && !jpg && !webp) throw new Error("codex_no_image"); return { bytes, mime: png ? "image/png" : jpg ? "image/jpeg" : "image/webp" };
}
export async function POST(request: NextRequest) {
  try { const origin = request.headers.get("origin"); const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim(); const requestHost = forwardedHost || request.headers.get("host") || new URL(request.url).host; if (!origin || new URL(origin).host.toLowerCase() !== requestHost.toLowerCase()) return json(403, { ok: false, reason: "origin" }); } catch { return json(403, { ok: false, reason: "origin" }); }
  if (limited(request)) return json(429, { ok: false, reason: "rate_limited" }); if (Number(request.headers.get("content-length") ?? 0) > 15 * 1024 * 1024) return json(413, { ok: false, reason: "too_large" }); let body: unknown; try { body = await request.json(); } catch { return json(400, { ok: false, reason: "invalid_request" }); }
  if (!body || typeof body !== "object") return json(422, { ok: false, reason: "invalid_request" }); const data = body as Record<string, unknown>; const clean = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0,max) : "";
  const industry = clean(data.industry,40); const visual = clean(data.visualDirection,1000); const headline = clean(data.headline,160); const objective = clean(data.objective,300); const platform = clean(data.platform,30); if (!IMAGE_RULES[industry] || !visual || !headline) return json(422, { ok: false, reason: "invalid_request" });
  const cacheBust = clean(data.cacheBust,80);
  let input: { bytes: Buffer; mime: string } | null = null;
  if (typeof data.imageDataUrl === "string") {
    const match = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(data.imageDataUrl);
    if (!match || match[2].length > 28_000_000) return json(415, { ok: false, reason: "invalid_image" });
    const bytes = Buffer.from(match[2], "base64");
    const png = bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])); const jpg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255; const webp = bytes.subarray(0,4).toString() === "RIFF" && bytes.subarray(8,12).toString() === "WEBP";
    if (bytes.length > 10 * 1024 * 1024 || (!png && !jpg && !webp)) return json(415, { ok: false, reason: "invalid_image" });
    input = { bytes, mime: png ? "image/png" : jpg ? "image/jpeg" : "image/webp" };
  }
  // Restaurant campaigns require approved real photography; never invent menu items by generative image creation.
  const sourceOnly = industry === "餐馆" || data.preserveSource === true;
  if (sourceOnly && !input) return json(422, { ok: false, reason: "invalid_image" });
  const digestFor = (seed: string) => { const hash = createHash("sha256").update(seed); if (input) hash.update(input.bytes); return hash.digest("hex"); };
  async function cachedImage(digest: string) {
    for (const mime of ["image/png", "image/jpeg", "image/webp"]) {
      const key = marketingImageCacheKey(digest, mime);
      const cached = await getObject(key);
      if (cached) return { bytes: cached.bytes, mime: cached.mime, url: publicMediaUrl(key) };
    }
    return null;
  }
  if (sourceOnly && input) {
    const digest = digestFor("postory-marketing-source-v1");
    const cached = await cachedImage(digest);
    if (cached) return json(200, { ok: true, provider: "source_photo", cacheHit: true, imageUrl: cached.url });
    const key = marketingImageCacheKey(digest, input.mime);
    await putObject(key, input.bytes);
    return json(200, { ok: true, provider: "source_photo", cacheHit: false, imageUrl: publicMediaUrl(key) });
  }
  const platformRule = PLATFORM_RULES[platform] || PLATFORM_RULES.Instagram;
  const prompt = `${input ? "Use the supplied product photo as the visual source. Preserve the real product's shape, color and visible details; create a fresh, distinct campaign composition suitable for this post." : "Create one polished, photorealistic paid-social campaign image"} for a ${industry} local business. INDUSTRY ART RULE: ${IMAGE_RULES[industry]} PLATFORM FORMAT: ${platformRule}. AD CONCEPT: ${headline}. CUSTOMER ACTION/GOAL: ${objective}. SHOT DIRECTION: ${visual}. Use a consistent commercial-ad craft standard: one unmistakable hero subject, tight or purposeful framing, directional natural light, deliberate contrasting palette, clean hierarchy, and a clean lower safe area for the interface to add the real headline and action afterward. Make the subject and reason to care clear in a fast scroll. Treat this as an image asset for a real local campaign, never a generic stock photo. Do not render any text, letters, numbers, logo, watermark, badge, or fake promotional claim. Do not invent ingredients, product features, prices, or discounts.`;
  const imageDigest = digestFor(`postory-marketing-image-v1\n${prompt}\n${platform}\n${cacheBust}`);
  const cached = await cachedImage(imageDigest);
  if (cached) return json(200, { ok: true, provider: "cached", cacheHit: true, imageUrl: cached.url });
  const local = process.env.NODE_ENV === "development" && process.env.VIDEO_RECOGNITION_PROVIDER === "codex_cli"; const dir = await mkdtemp(path.join(os.tmpdir(), "postory-calendar-image-"));
  try { const inputPath = input ? path.join(dir, `source.${input.mime === "image/jpeg" ? "jpg" : input.mime.split("/")[1]}`) : undefined; if (inputPath && input) await (await import("node:fs/promises")).writeFile(inputPath, input.bytes); const ratio = platform === "TikTok" ? "story" : platform === "小红书" ? "portrait" : platform === "Facebook" ? "portrait" : "square"; const generated = local ? await codexImage(prompt, path.join(dir,"post.png"),dir,inputPath) : await openAiImageProvider.generate({ prompt, ratio, quality: "standard", input }); const key = marketingImageCacheKey(imageDigest, generated.mime); await putObject(key, generated.bytes); return json(200,{ok:true,provider:local?"codex_cli":"openai_api",cacheHit:false,imageUrl:publicMediaUrl(key)}); }
  catch(error) { const reason = error instanceof Error && ["codex_not_logged_in","codex_unavailable","codex_timeout","codex_no_image","codex_failed"].includes(error.message) ? error.message : error instanceof ProviderError ? "image_generation_failed" : "generation_failed"; return json(502,{ok:false,reason}); }
  finally { await rm(dir,{recursive:true,force:true}).catch(()=>undefined); }
}
