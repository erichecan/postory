import "server-only";
import { cache } from "react";
import { prisma } from "./client";
import { chargeCredits, getBalance, type ChargeResult } from "./credits";
import { DEMO_PHONE } from "@/lib/demo";
import { BASE_PUBLISH_PLATFORMS, isExtraPlatform } from "@/lib/platforms";
import type { Currency } from "@/types/commerce";

export type Entitlements = {
  hasActivePlan: boolean;
  allowedPlatforms: string[];
  topup: { currency: Currency; unitPrice: number } | null;
  topupBlocked: "demo" | "noPlan" | null;
};

export const getEntitlements = cache(async (userId: string): Promise<Entitlements> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { phone: true, plan: { select: { status: true, extraPlatforms: true, currency: true, topupUnitPrice: true } } },
  });
  const plan = user?.plan;
  const active = !!plan && (plan.status === "ACTIVE" || plan.status === "PAST_DUE");
  const isDemo = user?.phone === DEMO_PHONE;
  return {
    hasActivePlan: active,
    allowedPlatforms: active ? [...BASE_PUBLISH_PLATFORMS, ...plan.extraPlatforms.filter(isExtraPlatform)] : [],
    topup: active && !isDemo ? { currency: plan.currency, unitPrice: plan.topupUnitPrice } : null,
    topupBlocked: isDemo ? "demo" : active ? null : "noPlan",
  };
});

export type DesignChargeResult = (ChargeResult & { found: true }) | { found: false };

export async function chargeDesign(userId: string, designId: string): Promise<DesignChargeResult> {
  const design = await prisma.design.findFirst({ where: { id: designId, userId }, select: { id: true } });
  if (!design) return { found: false };
  const result = await chargeCredits(userId, "TEMPLATE_EXPORT", `design:${design.id}`);
  if (result.ok && !result.duplicate) {
    await prisma.design.updateMany({ where: { id: design.id, chargedAt: null }, data: { chargedAt: new Date() } });
  }
  return { ...result, found: true };
}

export { getBalance };
