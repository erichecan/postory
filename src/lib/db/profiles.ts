import "server-only";
import { prisma } from "./client";

import type { Country, Industry } from "@/generated/prisma/client";

export type BrandProfileInput = {
  shopName: string | null;
  wechat: string | null;
  phone: string | null;
  address: string | null;
  slogan: string | null;
  activity: string | null;
  logoUrl?: string | null;
  industry?: Industry | null;
  country?: Country | null;
  whatsappNumber?: string | null;
  marketingEmailOptIn?: boolean;
  marketingSmsOptIn?: boolean;
};

const PROFILE_SELECT = {
  shopName: true,
  wechat: true,
  phone: true,
  address: true,
  slogan: true,
  activity: true,
  logoUrl: true,
  industry: true,
  country: true,
  whatsappNumber: true,
  marketingEmailOptIn: true,
  marketingSmsOptIn: true,
} as const;

export async function getBrandProfile(userId: string) {
  return prisma.brandProfile.findUnique({ where: { userId }, select: PROFILE_SELECT });
}

export async function upsertBrandProfile(userId: string, data: BrandProfileInput) {
  return prisma.brandProfile.upsert({ where: { userId }, create: { userId, ...data }, update: data, select: { userId: true } });
}

export async function getCalendarProfile(userId: string) {
  return prisma.brandProfile.findUnique({ where: { userId }, select: { industry: true, country: true } });
}
