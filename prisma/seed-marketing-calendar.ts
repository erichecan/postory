import { readFileSync } from "node:fs";
import type { PrismaClient, EventRegion, Industry, PromoMechanism } from "../src/generated/prisma/client";

type MarketingEventSeed = {
  id: string;
  startDate: string;
  endDate: string;
  nameZh: string;
  nameEn: string;
  region: EventRegion;
  industries: Industry[];
  prepWeeks: number;
  source: string;
};

type CampaignTemplateSeed = {
  id: string;
  industry: Industry;
  nameZh: string;
  nameEn: string;
  mechanism: PromoMechanism;
  suggestedPostCount: number;
  eventId?: string;
  captionAngle: string;
};

export async function seedMarketingCalendar(prisma: PrismaClient) {
  const events = JSON.parse(readFileSync("src/data/marketing-events.json", "utf8")) as MarketingEventSeed[];
  for (const e of events) {
    const data = {
      startDate: new Date(e.startDate),
      endDate: new Date(e.endDate),
      nameZh: e.nameZh,
      nameEn: e.nameEn,
      region: e.region,
      industries: e.industries,
      prepWeeks: e.prepWeeks,
      source: e.source,
    };
    await prisma.marketingEvent.upsert({ where: { id: e.id }, create: { id: e.id, ...data }, update: data });
  }

  const campaigns = JSON.parse(readFileSync("src/data/campaign-templates.json", "utf8")) as CampaignTemplateSeed[];
  for (const c of campaigns) {
    const data = {
      industry: c.industry,
      nameZh: c.nameZh,
      nameEn: c.nameEn,
      mechanism: c.mechanism,
      suggestedPostCount: c.suggestedPostCount,
      eventId: c.eventId ?? null,
      captionAngle: c.captionAngle,
    };
    await prisma.campaignTemplate.upsert({ where: { id: c.id }, create: { id: c.id, ...data }, update: data });
  }

  console.log(`marketingEvents=${await prisma.marketingEvent.count()} campaignTemplates=${await prisma.campaignTemplate.count()}`);
}
