import "server-only";
import { prisma } from "./client";

export type BrandProfileInput = {
  shopName: string | null;
  wechat: string | null;
  phone: string | null;
  address: string | null;
  slogan: string | null;
  activity: string | null;
  logoUrl?: string | null;
};

export async function getBrandProfile(userId: string) {
  return prisma.brandProfile.findUnique({
    where: { userId },
    select: { shopName: true, wechat: true, phone: true, address: true, slogan: true, activity: true, logoUrl: true },
  });
}

export async function upsertBrandProfile(userId: string, data: BrandProfileInput) {
  return prisma.brandProfile.upsert({ where: { userId }, create: { userId, ...data }, update: data, select: { userId: true } });
}
