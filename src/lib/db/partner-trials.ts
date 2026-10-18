import "server-only";
import { randomBytes } from "node:crypto";
import { prisma } from "./client";
import { Prisma } from "@/generated/prisma/client";
import type { Country, Industry, PartnerTrialFeedbackCategory } from "@/generated/prisma/client";

export type CreateTrialRequestInput = {
  agencyUserId: string | null;
  agencyName: string;
  agencyContact: string;
  clientBrandName: string;
  industry: Industry;
  country: Country;
  productOrService: string;
  targetAudience: string | null;
  highlightNotes: string | null;
  platforms: string[];
  websiteUrl: string | null;
  socialHandles: Prisma.InputJsonValue | null;
  languagePreference: string;
};

const TRIAL_DETAIL_INCLUDE = {
  assets: { orderBy: { createdAt: "asc" as const } },
  planItems: { orderBy: { date: "asc" as const } },
  feedback: { orderBy: { createdAt: "asc" as const } },
};

function generateViewToken() {
  return randomBytes(32).toString("base64url");
}

// 判重：同一个客户（品牌名+代理商联系方式）此前已经提交过未转付费的试做，
// 直接把原来那条连同专属链接返回，而不是再开一条——按客户限 1 次，不按代理商限制。
export async function createTrialRequest(input: CreateTrialRequestInput): Promise<{ request: { id: string; viewToken: string }; duplicate: boolean }> {
  const existing = await prisma.partnerTrialRequest.findFirst({
    where: { clientBrandName: input.clientBrandName, agencyContact: input.agencyContact, status: { not: "CONVERTED" } },
    select: { id: true, viewToken: true },
  });
  if (existing) return { request: existing, duplicate: true };

  const request = await prisma.partnerTrialRequest.create({
    data: { ...input, socialHandles: input.socialHandles ?? Prisma.JsonNull, viewToken: generateViewToken() },
    select: { id: true, viewToken: true },
  });
  return { request, duplicate: false };
}

export async function getTrialRequestByToken(viewToken: string) {
  return prisma.partnerTrialRequest.findUnique({ where: { viewToken }, include: TRIAL_DETAIL_INCLUDE });
}

export async function getTrialRequestById(id: string) {
  return prisma.partnerTrialRequest.findUnique({ where: { id }, include: TRIAL_DETAIL_INCLUDE });
}

export async function addTrialFeedback(trialRequestId: string, category: PartnerTrialFeedbackCategory, content: string) {
  const owner = await prisma.partnerTrialRequest.findUnique({ where: { id: trialRequestId }, select: { id: true } });
  if (!owner) return null;
  return prisma.partnerTrialFeedback.create({ data: { trialRequestId, category, content }, select: { id: true } });
}
