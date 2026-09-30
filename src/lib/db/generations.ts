import "server-only";
import { prisma } from "./client";
import { refundCharge } from "./credits";
import type { GenerationMode, Prisma } from "@/generated/prisma/client";

export const GENERATION_STALE_MS = 10 * 60_000;
export const GENERATION_HOURLY_LIMIT = 30;
export const GENERATIONS_PER_PAGE = 24;

export const chargeRef = (generationId: string) => `gen:${generationId}`;

export type ReserveInput = {
  mode: GenerationMode;
  quality: "standard" | "hd";
  size: string;
  userPrompt: string;
  finalPrompt: string;
  parentId: string | null;
  inputUrl: string | null;
  credits: number;
  estimateMicros: number;
  capMicros: number;
};

export type ReserveResult = { ok: true; id: string } | { ok: false; code: "busy" | "rateLimited" | "capReached" };

function startOfUtcDay(now: Date) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export async function reserveGeneration(userId: string, input: ReserveInput, now = new Date()): Promise<ReserveResult> {
  const { estimateMicros, capMicros, ...data } = input;
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;
    const running = await tx.generation.count({ where: { userId, status: "PENDING", createdAt: { gt: new Date(now.getTime() - GENERATION_STALE_MS) } } });
    if (running > 0) return { ok: false, code: "busy" };
    const lastHour = await tx.generation.count({ where: { userId, createdAt: { gt: new Date(now.getTime() - 3_600_000) } } });
    if (lastHour >= GENERATION_HOURLY_LIMIT) return { ok: false, code: "rateLimited" };
    const spent = await tx.generation.aggregate({ where: { createdAt: { gte: startOfUtcDay(now) }, costMicros: { not: null } }, _sum: { costMicros: true } });
    if ((spent._sum.costMicros ?? 0) + estimateMicros > capMicros) return { ok: false, code: "capReached" };
    const gen = await tx.generation.create({ data: { ...data, userId }, select: { id: true } });
    return { ok: true, id: gen.id };
  });
}

export async function discardGeneration(id: string) {
  await prisma.generation.deleteMany({ where: { id, status: "PENDING" } });
}

export async function setGenerationInput(id: string, inputUrl: string) {
  await prisma.generation.update({ where: { id }, data: { inputUrl } });
}

export type ClaimResult = "claimed" | "notFound" | "alreadyStarted";

export async function claimGeneration(userId: string, id: string): Promise<ClaimResult> {
  const res = await prisma.generation.updateMany({ where: { id, userId, status: "PENDING", startedAt: null }, data: { startedAt: new Date() } });
  if (res.count === 1) return "claimed";
  const exists = await prisma.generation.findFirst({ where: { id, userId }, select: { id: true } });
  return exists ? "alreadyStarted" : "notFound";
}

export async function completeGeneration(id: string, outputUrl: string, costMicros: number) {
  const res = await prisma.generation.updateMany({ where: { id, status: "PENDING" }, data: { status: "SUCCEEDED", outputUrl, costMicros } });
  return res.count === 1;
}

export async function failGeneration(userId: string, id: string, error: string) {
  const res = await prisma.generation.updateMany({ where: { id, userId, status: "PENDING" }, data: { status: "FAILED", error: error.slice(0, 255) } });
  if (res.count === 1) await refundCharge(userId, chargeRef(id));
  return res.count === 1;
}

export async function reapStaleGenerations(userId: string, now = new Date()) {
  const stale = await prisma.generation.findMany({
    where: { userId, status: "PENDING", createdAt: { lte: new Date(now.getTime() - GENERATION_STALE_MS) } },
    select: { id: true },
  });
  for (const g of stale) await failGeneration(userId, g.id, "timeout");
  return stale.length;
}

const ownSelect = {
  id: true,
  parentId: true,
  mode: true,
  quality: true,
  size: true,
  userPrompt: true,
  inputUrl: true,
  outputUrl: true,
  credits: true,
  status: true,
  error: true,
  createdAt: true,
} satisfies Prisma.GenerationSelect;

export type GenerationView = Prisma.GenerationGetPayload<{ select: typeof ownSelect }>;

export async function getOwnGeneration(userId: string, id: string): Promise<GenerationView | null> {
  return prisma.generation.findFirst({ where: { id, userId }, select: ownSelect });
}

export async function getGenerationPrompt(id: string) {
  return prisma.generation.findUnique({ where: { id }, select: { finalPrompt: true, size: true, quality: true, inputUrl: true, createdAt: true } });
}

export async function listOwnGenerations(userId: string, page = 1) {
  const [items, total] = await prisma.$transaction([
    prisma.generation.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, skip: (page - 1) * GENERATIONS_PER_PAGE, take: GENERATIONS_PER_PAGE, select: ownSelect }),
    prisma.generation.count({ where: { userId } }),
  ]);
  return { items, total, pageCount: Math.max(1, Math.ceil(total / GENERATIONS_PER_PAGE)) };
}
