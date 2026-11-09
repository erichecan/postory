import "./load-env";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { SESSION_COOKIE, signSession } from "../src/lib/auth/token";

const BASE = process.argv[2] ?? "http://localhost:3010";
const ASSETS = [
  { path: "/Users/eric/Documents/ChatGPT/登泰山/out/videos/AhgDYurJWG/500刀家具预算挑战.mp4", description: "500 刀家具预算挑战" },
  { path: "/Users/eric/Documents/ChatGPT/登泰山/out/videos/AR99shUPbf/黑五冰箱洗衣机烘干机促销.mp4", description: "黑五冰箱洗衣机烘干机促销" },
];
const ONLY = process.argv[3];

if (!/^http:\/\/localhost:\d+$/.test(BASE) || !/@(localhost|127\.0\.0\.1)[:/]/.test(process.env.DATABASE_URL ?? "")) {
  throw new Error("Video probe only allows localhost and a local database.");
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  const admin = await prisma.user.findUniqueOrThrow({ where: { phone: "13800000000" }, select: { id: true, role: true } });
  if (admin.role !== "ADMIN") throw new Error("The local probe account is not an administrator.");
  const cookie = `${SESSION_COOKIE}=${await signSession({ userId: admin.id, role: "ADMIN" })}`;

  const selectedAssets = ONLY ? ASSETS.filter((asset) => asset.path.includes(ONLY)) : ASSETS;
  if (!selectedAssets.length) throw new Error(`No sample video matches selector: ${ONLY}`);
  for (const asset of selectedAssets) {
    const bytes = await readFile(asset.path);
    const form = new FormData();
    form.set("video", new Blob([new Uint8Array(bytes)], { type: "video/mp4" }), path.basename(asset.path));
    form.set("description", asset.description);
    form.set("customerFacts", "");
    const response = await fetch(`${BASE}/api/admin/video-recognition`, { method: "POST", headers: { cookie, origin: BASE }, body: form, cache: "no-store" });
    const body = await response.json() as { ok: boolean; reason?: string; message?: string; result?: {
      video: { durationSeconds: number; width: number; height: number; audioAvailable: boolean };
      sample: { initialFrames: number; supplementalFrames: number; totalFrames: number; sceneChangesDetected: number };
      transcript: { status: string; audioSeconds: number; estimatedUsd: number };
      model: string;
      usage: { inputTokens: number; outputTokens: number; estimatedUsd: number };
      elapsedMs: number;
      result: { themeCategory: string; overview: string; coverageConfidence: string; candidateGroups: Array<{ candidateId: string; individuallyProminent: boolean; contentPotential: string; confidence: string }>; opportunities: Array<{ type: string; summary: string; candidateIds: string[] }>; relationships: Array<{ type: string; summary: string; candidateIds: string[] }>; materialAssessment: { status: string; limitations: string[] }; unverifiedClaims: Array<{ kind: string; claim: string; source: string }> };
      warnings: string[];
    } };
    if (!response.ok || !body.ok || !body.result) throw new Error(`${asset.description}: HTTP ${response.status} ${body.reason ?? ""} ${body.message ?? ""}`);
    const run = body.result;
    console.log(JSON.stringify({
      asset: path.basename(asset.path),
      durationSeconds: Number(run.video.durationSeconds.toFixed(1)),
      dimensions: `${run.video.width}x${run.video.height}`,
      audioAvailable: run.video.audioAvailable,
      frames: run.sample,
      transcript: { status: run.transcript.status, audioSeconds: Number(run.transcript.audioSeconds.toFixed(1)), estimatedUsd: run.transcript.estimatedUsd },
      model: run.model,
      usage: run.usage,
      elapsedSeconds: Number((run.elapsedMs / 1000).toFixed(1)),
      recognition: run.result,
      warnings: run.warnings,
    }, null, 2));
  }
}

main().finally(() => prisma.$disconnect());
