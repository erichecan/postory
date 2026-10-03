import "server-only";
import { prisma } from "./client";
import type { Industry, Country } from "@/generated/prisma/client";
import { WEEKLY_RHYTHM_BY_WEEKDAY } from "@/lib/marketing-calendar/weekly-rhythm";

// @db.Date 列只存日期，用 UTC 午夜构造，避免本地时区把日期前后挪一天。
function utcDate(y: number, m: number, d: number) {
  return new Date(Date.UTC(y, m, d));
}

function parseYearMonth(yearMonth: string): { year: number; month: number } {
  const [y, m] = yearMonth.split("-").map(Number);
  return { year: y, month: m - 1 };
}

export type GenerateMonthResult = { ok: true; created: number } | { ok: false; reason: "missing_profile" };

export async function generateMonthSlots(userId: string, yearMonth: string): Promise<GenerateMonthResult> {
  const profile = await prisma.brandProfile.findUnique({ where: { userId }, select: { industry: true, country: true } });
  if (!profile?.industry || !profile.country || profile.industry === "OTHER") return { ok: false, reason: "missing_profile" };
  const industry: Industry = profile.industry;
  const country: Country = profile.country;

  const { year, month } = parseYearMonth(yearMonth);
  const monthStart = utcDate(year, month, 1);
  const monthEnd = utcDate(year, month + 1, 0);

  const events = await prisma.marketingEvent.findMany({
    where: {
      industries: { has: industry },
      region: { in: [country, "BOTH", "CHINESE_COMMUNITY"] },
      startDate: { lte: monthEnd },
      endDate: { gte: monthStart },
    },
  });

  const eventCampaigns = events.length
    ? await prisma.campaignTemplate.findMany({ where: { industry, eventId: { in: events.map((e) => e.id) } } })
    : [];
  const campaignByEventId = new Map(eventCampaigns.map((c) => [c.eventId!, c]));

  const usedDates = new Set<string>();
  const slots: {
    userId: string;
    date: Date;
    eventId?: string;
    campaignTemplateId?: string;
    weeklyRhythmTag?: string;
  }[] = [];

  for (const event of events) {
    const anchor = event.startDate < monthStart ? monthStart : event.startDate;
    const key = anchor.toISOString().slice(0, 10);
    if (usedDates.has(key)) continue;
    usedDates.add(key);
    const campaign = campaignByEventId.get(event.id);
    slots.push({ userId, date: anchor, eventId: event.id, campaignTemplateId: campaign?.id });
  }

  // 没有节点占用的日子，按每周节奏规则（weekly-rhythm.ts）填充日常栏目，
  // 候选活动从该行业"常规栏目"池（eventId 为空）里轮转，避免总挂同一个。
  const regularCampaigns = await prisma.campaignTemplate.findMany({ where: { industry, eventId: null } });
  let rotation = 0;
  const daysInMonth = monthEnd.getUTCDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const date = utcDate(year, month, d);
    const key = date.toISOString().slice(0, 10);
    if (usedDates.has(key)) continue;
    const tag = WEEKLY_RHYTHM_BY_WEEKDAY[date.getUTCDay()];
    if (!tag) continue;
    const campaign = regularCampaigns.length ? regularCampaigns[rotation++ % regularCampaigns.length] : undefined;
    usedDates.add(key);
    slots.push({ userId, date, weeklyRhythmTag: tag, campaignTemplateId: campaign?.id });
  }

  if (slots.length === 0) return { ok: true, created: 0 };
  const result = await prisma.calendarSlot.createMany({ data: slots, skipDuplicates: true });
  return { ok: true, created: result.count };
}

export async function listUpcomingSlots(userId: string, days = 7) {
  const now = new Date();
  const start = utcDate(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const end = new Date(start.getTime() + (days - 1) * 86400000);
  return prisma.calendarSlot.findMany({
    where: { userId, date: { gte: start, lte: end } },
    include: { campaignTemplate: true, event: true, design: { select: { id: true, status: true, publishStatus: true, platforms: true } } },
    orderBy: { date: "asc" },
  });
}

export async function listMonthSlots(userId: string, yearMonth: string) {
  const { year, month } = parseYearMonth(yearMonth);
  const monthStart = utcDate(year, month, 1);
  const monthEnd = utcDate(year, month + 1, 0);
  return prisma.calendarSlot.findMany({
    where: { userId, date: { gte: monthStart, lte: monthEnd } },
    include: { campaignTemplate: true, event: true, design: { select: { id: true, status: true, publishStatus: true } } },
    orderBy: { date: "asc" },
  });
}
