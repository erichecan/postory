import "server-only";
import { randomBytes } from "node:crypto";
import { prisma } from "./client";
import type { RestaurantBriefStatus, RestaurantContentStatus } from "@/generated/prisma/client";

const PUBLIC_BRIEF_INCLUDE = {
  references: { orderBy: { createdAt: "asc" as const } },
  content: { orderBy: { createdAt: "asc" as const } },
  marketingPlan: { include: { items: { orderBy: { date: "asc" as const }, include: { submissions: { orderBy: { createdAt: "desc" as const }, include: { references: true } } } }, submissions: { orderBy: { createdAt: "desc" as const }, include: { references: true } } } },
};

export async function createRestaurantCampaignBrief(input: {
  referralUserId: string | null;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  businessName: string;
  location: string;
  websiteUrl: string | null;
  campaignDirection: string;
  campaignGoal: string;
  campaignDetails: string;
  campaignStartDate: Date | null;
  campaignEndDate: Date | null;
  preferredPostWindow: string;
  platforms: string[];
  languagePreference: string;
}) {
  return prisma.restaurantCampaignBrief.create({
    data: { ...input, token: randomBytes(24).toString("hex") },
    select: { id: true, token: true },
  });
}

export function getRestaurantBriefByToken(token: string) {
  return prisma.restaurantCampaignBrief.findUnique({
    where: { token },
    select: {
      id: true, token: true, status: true, businessName: true, location: true,
      campaignDirection: true, campaignGoal: true, campaignDetails: true,
      campaignStartDate: true, campaignEndDate: true, preferredPostWindow: true,
      timeZone: true, platforms: true, languagePreference: true,
      references: { orderBy: { createdAt: "asc" }, select: { id: true, storageKey: true, mimeType: true } },
      content: { orderBy: { createdAt: "asc" }, select: { id: true, title: true, caption: true, storageKey: true, mimeType: true, platforms: true, scheduledAt: true, status: true, revisionNote: true, publishStatus: true, publishError: true, providerPostId: true, publishedAt: true, createdAt: true } },
    },
  });
}

export function deleteRestaurantBrief(id: string) {
  return prisma.restaurantCampaignBrief.delete({ where: { id }, select: { id: true } });
}

export function getRestaurantBriefById(id: string) {
  return prisma.restaurantCampaignBrief.findUnique({
    where: { id },
    include: { ...PUBLIC_BRIEF_INCLUDE, referrer: { select: { id: true, name: true, email: true } }, client: { select: { id: true, name: true, email: true } } },
  });
}

export function getRestaurantBriefForClient(id: string, clientUserId: string) {
  return prisma.restaurantCampaignBrief.findFirst({
    where: { id, clientUserId },
    select: {
      id: true, businessName: true, location: true, campaignDirection: true, campaignGoal: true,
      campaignStartDate: true, campaignEndDate: true, platforms: true,
      marketingPlan: { include: { items: { orderBy: { date: "asc" }, include: { content: true, submissions: { orderBy: { createdAt: "desc" }, include: { references: true } } } }, submissions: { orderBy: { createdAt: "desc" }, include: { references: true } } } },
      content: { orderBy: [{ scheduledAt: "asc" }, { createdAt: "desc" }], select: { id: true, title: true, caption: true, storageKey: true, mimeType: true, platforms: true, scheduledAt: true, status: true, revisionNote: true, publishError: true, publishedAt: true, planItemId: true } },
    },
  });
}

export function listRestaurantBriefsForClient(clientUserId: string) {
  return prisma.restaurantCampaignBrief.findMany({
    where: { clientUserId }, orderBy: { createdAt: "desc" },
    select: { id: true, businessName: true, location: true, status: true, createdAt: true, marketingPlan: { select: { title: true, startDate: true, endDate: true, _count: { select: { items: true } } } } },
  });
}

export async function getRestaurantCampaignLandingPath(clientUserId: string) {
  const briefs = await prisma.restaurantCampaignBrief.findMany({
    where: { clientUserId }, orderBy: { createdAt: "desc" }, take: 2, select: { id: true },
  });
  if (briefs.length === 1) return `/restaurant/campaigns/${briefs[0].id}`;
  if (briefs.length > 1) return "/restaurant/campaigns";
  return null;
}

export function getRestaurantBriefForClaim(token: string) {
  return prisma.restaurantCampaignBrief.findUnique({ where: { token }, select: { id: true, token: true, contactEmail: true, clientUserId: true, referralUserId: true } });
}

export async function upsertRestaurantMarketingPlan(input: { briefId: string; title: string; overview: string; startDate: Date; endDate: Date; cadence: string }) {
  return prisma.restaurantMarketingPlan.upsert({
    where: { briefId: input.briefId }, create: input,
    update: { title: input.title, overview: input.overview, startDate: input.startDate, endDate: input.endDate, cadence: input.cadence },
    select: { id: true },
  });
}

export async function addRestaurantMarketingPlanItem(input: { planId: string; date: Date; scheduledTime: string | null; title: string; theme: string; objective: string; concept: string; platforms: string[] }) {
  return prisma.restaurantMarketingPlanItem.create({ data: input, select: { id: true } });
}

export async function setRestaurantPlanItemStatus(id: string, status: "IN_PRODUCTION" | "AWAITING_APPROVAL" | "APPROVED" | "SCHEDULED" | "PUBLISHED" | "FAILED") {
  return prisma.restaurantMarketingPlanItem.updateMany({ where: { id }, data: { status } });
}

export function listRestaurantBriefs() {
  return prisma.restaurantCampaignBrief.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, businessName: true, contactName: true, contactEmail: true, status: true, createdAt: true, referralUserId: true, referrer: { select: { name: true, email: true } }, _count: { select: { content: true, references: true } } },
  });
}

export async function addRestaurantCampaignReference(input: { briefId: string; storageKey: string; mimeType: string }) {
  return prisma.restaurantCampaignReference.create({ data: input, select: { id: true } });
}

export async function addRestaurantPlanItemSubmission(input: { planId: string; planItemId: string | null; date: Date; clientUserId: string; note: string | null; references: { briefId: string; storageKey: string; mimeType: string }[] }) {
  return prisma.$transaction(async (tx) => {
    const submission = await tx.restaurantPlanItemSubmission.create({
      data: { planId: input.planId, planItemId: input.planItemId, date: input.date, clientUserId: input.clientUserId, note: input.note },
      select: { id: true },
    });
    if (input.references.length) {
      await tx.restaurantCampaignReference.createMany({ data: input.references.map((reference) => ({ ...reference, submissionId: submission.id })) });
    }
    return submission;
  });
}

export async function addRestaurantCampaignContent(input: {
  briefId: string;
  title: string;
  caption: string;
  storageKey: string;
  mimeType: string;
  platforms: string[];
  scheduledAt: Date | null;
  planItemId?: string | null;
}) {
  return prisma.$transaction(async (tx) => {
    const content = await tx.restaurantCampaignContent.create({ data: input, select: { id: true } });
    if (input.planItemId) await tx.restaurantMarketingPlanItem.update({ where: { id: input.planItemId }, data: { status: "AWAITING_APPROVAL" } });
    await tx.restaurantCampaignBrief.update({ where: { id: input.briefId }, data: { status: "AWAITING_CLIENT" } });
    return content;
  });
}

export async function decideRestaurantCampaignContent(input: {
  id: string;
  briefId: string;
  status: Extract<RestaurantContentStatus, "APPROVED" | "REVISION_REQUESTED">;
  revisionNote: string | null;
}) {
  const updated = await prisma.restaurantCampaignContent.updateMany({
    where: { id: input.id, briefId: input.briefId, status: { in: ["AWAITING_APPROVAL", "REVISION_REQUESTED"] } },
    data: { status: input.status, revisionNote: input.revisionNote },
  });
  if (updated.count) {
    const content = await prisma.restaurantCampaignContent.findUnique({ where: { id: input.id }, select: { planItemId: true } });
    if (content?.planItemId) await prisma.restaurantMarketingPlanItem.update({ where: { id: content.planItemId }, data: { status: input.status === "APPROVED" ? "APPROVED" : "IN_PRODUCTION" } });
    const remaining = await prisma.restaurantCampaignContent.count({ where: { briefId: input.briefId, status: { in: ["AWAITING_APPROVAL", "REVISION_REQUESTED"] } } });
    const approved = await prisma.restaurantCampaignContent.count({ where: { briefId: input.briefId, status: "APPROVED" } });
    const next: RestaurantBriefStatus = remaining > 0 ? "AWAITING_CLIENT" : approved > 0 ? "ACTIVE" : "IN_PRODUCTION";
    await prisma.restaurantCampaignBrief.update({ where: { id: input.briefId }, data: { status: next } });
  }
  return updated.count === 1;
}

export async function setRestaurantBriefStatus(id: string, status: RestaurantBriefStatus, internalNotes?: string | null) {
  return prisma.restaurantCampaignBrief.update({ where: { id }, data: { status, ...(internalNotes !== undefined ? { internalNotes } : {}) }, select: { id: true, token: true } });
}

export async function linkRestaurantBriefClient(id: string, clientUserId: string, referralUserId: string | null) {
  return prisma.$transaction(async (tx) => {
    await tx.restaurantCampaignBrief.update({ where: { id }, data: { clientUserId }, select: { id: true } });
    if (referralUserId) {
      await tx.agencyAccess.upsert({
        where: { agencyUserId_clientUserId: { agencyUserId: referralUserId, clientUserId } },
        create: { agencyUserId: referralUserId, clientUserId },
        update: {},
      });
    }
  });
}

export async function updateRestaurantCampaignPublish(input: {
  id: string;
  status: Extract<RestaurantContentStatus, "SCHEDULED" | "PUBLISHED" | "FAILED">;
  publishStatus: "SUCCESS" | "PARTIAL" | "FAILED";
  publishError: string | null;
  providerPostId: string | null;
  publishedAt: Date | null;
}) {
  return prisma.restaurantCampaignContent.update({ where: { id: input.id }, data: input, select: { id: true, briefId: true } });
}

export async function isRestaurantCampaignMediaServable(storageKey: string) {
  const [reference, content] = await Promise.all([
    prisma.restaurantCampaignReference.findUnique({ where: { storageKey }, select: { id: true } }),
    prisma.restaurantCampaignContent.findUnique({ where: { storageKey }, select: { id: true, status: true } }),
  ]);
  return Boolean(reference || (content && content.status !== "FAILED"));
}
