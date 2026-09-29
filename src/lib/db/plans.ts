import "server-only";
import { unstable_cache } from "next/cache";
import { prisma } from "./client";
import type { Locale } from "@/i18n/config";
import type { TierFeatures } from "@/lib/billing/tier-features";
import type { PlanView, TierView } from "@/types/commerce";

export type TierDetail = TierView & { tagline: string; features: TierFeatures; recommended: boolean };

const TIERS_TAG = "tiers";

const loadTiers = unstable_cache(
  () =>
    prisma.membershipTier.findMany({
      where: { visible: true },
      orderBy: { sortOrder: "asc" },
    }),
  ["membership-tiers"],
  { tags: [TIERS_TAG], revalidate: 300 },
);

export async function listTiers(locale: Locale): Promise<TierDetail[]> {
  const rows = await loadTiers();
  return rows.map((r) => ({
    id: r.id,
    name: locale === "zh" ? r.nameZh : r.nameEn,
    tagline: locale === "zh" ? r.taglineZh : r.taglineEn,
    benefits: locale === "zh" ? r.benefitsZh : r.benefitsEn,
    features: r.features as TierFeatures,
    recommended: r.recommended,
    defaultMonthlyCredits: r.defaultMonthlyCredits,
    defaultMonthlyVideos: r.defaultMonthlyVideos,
  }));
}

export async function getPlanView(userId: string, locale: Locale): Promise<PlanView | null> {
  const plan = await prisma.customerPlan.findUnique({
    where: { userId },
    include: { tier: { select: { nameZh: true, nameEn: true } } },
  });
  if (!plan) return null;
  return {
    tierId: plan.tierId,
    tierName: locale === "zh" ? plan.tier.nameZh : plan.tier.nameEn,
    currency: plan.currency,
    billing: plan.billing,
    baseFee: plan.baseFee,
    extraPlatforms: plan.extraPlatforms,
    extraPlatformFee: plan.extraPlatformFee,
    allInclusiveFee: plan.allInclusiveFee,
    monthlyCredits: plan.monthlyCredits,
    monthlyVideos: plan.monthlyVideos,
    topupUnitPrice: plan.topupUnitPrice,
    status: plan.status,
    currentPeriodEnd: plan.currentPeriodEnd,
  };
}
