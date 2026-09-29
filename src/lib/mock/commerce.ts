// C0 静态页假数据，C1 起由 src/lib/db/ 替换后删除
import type { Locale } from "@/i18n/config";
import type { BalanceView, PlanView, TierView, TxnView } from "@/types/commerce";

const DAY = 24 * 3600 * 1000;

const TIERS: Record<Locale, TierView[]> = {
  zh: [
    { id: "basic", name: "基础会员", benefits: ["每月 60 张图片额度", "每月 4 条视频", "发布到 Facebook、Instagram、TikTok、小红书", "全部模板可用", "AI 生图：标准 1 credit / 高清 2 credit"], defaultMonthlyCredits: 60, defaultMonthlyVideos: 4 },
    { id: "growth", name: "成长会员", benefits: ["每月 150 张图片额度", "每月 10 条视频", "基础 4 个平台 + 可加开更多平台", "店铺资料一键填入", "优先支持"], defaultMonthlyCredits: 150, defaultMonthlyVideos: 10 },
    { id: "all-in", name: "全包会员", benefits: ["图片、视频按需定制", "全部平台", "专人对接出图", "月度内容规划"], defaultMonthlyCredits: 300, defaultMonthlyVideos: 20 },
  ],
  en: [
    { id: "basic", name: "Basic", benefits: ["60 image credits per month", "4 videos per month", "Publish to Facebook, Instagram, TikTok and RedNote", "Every template unlocked", "AI images: 1 credit standard / 2 credits HD"], defaultMonthlyCredits: 60, defaultMonthlyVideos: 4 },
    { id: "growth", name: "Growth", benefits: ["150 image credits per month", "10 videos per month", "The 4 core platforms, plus more on request", "One-click business details", "Priority support"], defaultMonthlyCredits: 150, defaultMonthlyVideos: 10 },
    { id: "all-in", name: "All-inclusive", benefits: ["Images and videos sized to your needs", "Every platform", "A dedicated designer", "Monthly content planning"], defaultMonthlyCredits: 300, defaultMonthlyVideos: 20 },
  ],
};

export function mockTiers(locale: Locale): TierView[] {
  return TIERS[locale];
}

export type MockPlanState = "active" | "pending" | "none";

export function mockPlan(locale: Locale, state: MockPlanState): PlanView | null {
  if (state === "none") return null;
  return {
    tierId: "basic",
    tierName: TIERS[locale][0].name,
    currency: "EUR",
    billing: "STRIPE",
    baseFee: 9900,
    extraPlatforms: ["x", "youtube"],
    extraPlatformFee: 3000,
    allInclusiveFee: null,
    monthlyCredits: 60,
    monthlyVideos: 4,
    topupUnitPrice: 100,
    status: state === "active" ? "ACTIVE" : "PENDING_PAYMENT",
    currentPeriodEnd: state === "active" ? new Date(Date.now() + 17 * DAY) : null,
  };
}

export function mockBalance(state: MockPlanState, empty = false): BalanceView {
  if (empty) return { total: 0, monthly: state === "active" ? { remaining: 0, amount: 60, expiresAt: new Date(Date.now() + 17 * DAY) } : null, templateOnly: 0, lasting: 0, videos: state === "active" ? { remaining: 1, amount: 4 } : null };
  if (state !== "active") return { total: 7, monthly: null, templateOnly: 7, lasting: 0, videos: null };
  return { total: 49, monthly: { remaining: 37, amount: 60, expiresAt: new Date(Date.now() + 17 * DAY) }, templateOnly: 2, lasting: 10, videos: { remaining: 3, amount: 4 } };
}

export function mockTxns(): TxnView[] {
  const now = Date.now();
  return [
    { id: "t1", kind: "DEBIT", charge: "AI_HD", source: null, delta: -2, note: null, createdAt: new Date(now - 2 * 3600 * 1000) },
    { id: "t2", kind: "DEBIT", charge: "AI_STANDARD", source: null, delta: -1, note: null, createdAt: new Date(now - 3 * 3600 * 1000) },
    { id: "t3", kind: "REFUND", charge: "AI_STANDARD", source: null, delta: 1, note: null, createdAt: new Date(now - 3.1 * 3600 * 1000) },
    { id: "t4", kind: "DEBIT", charge: "AI_STANDARD", source: null, delta: -1, note: null, createdAt: new Date(now - 3.2 * 3600 * 1000) },
    { id: "t5", kind: "DEBIT", charge: "TEMPLATE_EXPORT", source: null, delta: -1, note: null, createdAt: new Date(now - DAY) },
    { id: "t6", kind: "GRANT", charge: null, source: "TOPUP", delta: 10, note: null, createdAt: new Date(now - 4 * DAY) },
    { id: "t7", kind: "GRANT", charge: null, source: "MONTHLY", delta: 60, note: null, createdAt: new Date(now - 13 * DAY) },
    { id: "t8", kind: "GRANT", charge: null, source: "SIGNUP_GIFT", delta: 10, note: null, createdAt: new Date(now - 20 * DAY) },
  ];
}

export type MockCustomer = { id: string; name: string; email: string; phone: string | null; shopName: string };

export function mockCustomer(): MockCustomer {
  return { id: "demo-customer", name: "Marco Rossi", email: "marco@trattoria-rossi.it", phone: null, shopName: "Trattoria Rossi" };
}
