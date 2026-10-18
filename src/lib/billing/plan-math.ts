import type { ChargeKind, Currency, PlanFees } from "@/types/commerce";

// VIDEO_STANDARD/VIDEO_OVERAGE 单价未定（用户：计费逻辑一会再讨论），且代码库里还没有任何会真正发起
// 视频生成请求、调用 chargeCredits(VIDEO_STANDARD|VIDEO_OVERAGE) 的入口。这两项先占位为 0，
// 避免在没有真实单价和真实扣费路径的情况下伪造一个会被当成"已实现"的数字。
export const CHARGE_CREDITS: Record<ChargeKind, number> = {
  TEMPLATE_EXPORT: 1,
  AI_STANDARD: 1,
  AI_HD: 2,
  VIDEO_STANDARD: 0,
  VIDEO_OVERAGE: 0,
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

export type LineKey = "base" | "extraPlatform" | "allInclusive";
export type SubscriptionLine = { key: LineKey; unitAmount: number; quantity: number };

export function subscriptionLines(plan: PlanFees): SubscriptionLine[] {
  if (plan.allInclusiveFee !== null) return [{ key: "allInclusive", unitAmount: plan.allInclusiveFee, quantity: 1 }];
  const lines: SubscriptionLine[] = [{ key: "base", unitAmount: plan.baseFee, quantity: 1 }];
  if (plan.extraPlatforms.length > 0) lines.push({ key: "extraPlatform", unitAmount: plan.extraPlatformFee, quantity: plan.extraPlatforms.length });
  return lines.filter((l) => l.unitAmount > 0);
}

export const MAX_TOPUP_CREDITS = 10_000;
