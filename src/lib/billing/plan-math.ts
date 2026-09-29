import type { ChargeKind, Currency, PlanFees } from "@/types/commerce";

export const CHARGE_CREDITS: Record<ChargeKind, number> = {
  TEMPLATE_EXPORT: 1,
  AI_STANDARD: 1,
  AI_HD: 2,
};

export const DEFAULT_PLAN = {
  baseFee: 9900,
  extraPlatformFee: 3000,
  monthlyCredits: 60,
  monthlyVideos: 4,
  topupUnitPrice: 100,
} as const;

export const MIN_TOPUP_CREDITS = 10;
export const SIGNUP_GIFT_CREDITS = 10;

export function monthlyTotal(plan: PlanFees): number {
  return plan.allInclusiveFee ?? plan.baseFee + plan.extraPlatforms.length * plan.extraPlatformFee;
}

export function formatMoney(cents: number, currency: Currency, locale: string): string {
  return new Intl.NumberFormat(locale === "zh" ? "zh-CN" : "en-CA", {
    style: "currency",
    currency,
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}
