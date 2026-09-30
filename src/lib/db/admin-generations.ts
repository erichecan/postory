import "server-only";
import { prisma } from "./client";

export const GENERATION_LOG_PAGE_SIZE = 24;

export type DailyGenerationStats = { day: Date; total: number; succeeded: number; failed: number; costMicros: number; credits: number };

export async function dailyGenerationStats(days = 30, now = new Date()): Promise<DailyGenerationStats[]> {
  const since = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (days - 1)));
  const rows = await prisma.$queryRaw<{ day: Date; total: bigint; succeeded: bigint; failed: bigint; cost: bigint | null; credits: bigint | null }[]>`
    SELECT date_trunc('day', "createdAt" AT TIME ZONE 'UTC') AS day,
           count(*) AS total,
           count(*) FILTER (WHERE status = 'SUCCEEDED') AS succeeded,
           count(*) FILTER (WHERE status = 'FAILED') AS failed,
           sum("costMicros") AS cost,
           sum(credits) FILTER (WHERE status = 'SUCCEEDED') AS credits
    FROM "Generation"
    WHERE "createdAt" >= ${since}
    GROUP BY 1
    ORDER BY 1 DESC`;
  return rows.map((r) => ({ day: r.day, total: Number(r.total), succeeded: Number(r.succeeded), failed: Number(r.failed), costMicros: Number(r.cost ?? 0), credits: Number(r.credits ?? 0) }));
}

export async function listGenerationLog(page = 1) {
  const [items, total] = await prisma.$transaction([
    prisma.generation.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * GENERATION_LOG_PAGE_SIZE,
      take: GENERATION_LOG_PAGE_SIZE,
      select: { id: true, createdAt: true, mode: true, quality: true, status: true, credits: true, costMicros: true, error: true, outputUrl: true, user: { select: { id: true, email: true, name: true } } },
    }),
    prisma.generation.count(),
  ]);
  return { items, total, pageCount: Math.max(1, Math.ceil(total / GENERATION_LOG_PAGE_SIZE)) };
}
