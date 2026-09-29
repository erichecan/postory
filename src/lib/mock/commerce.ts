// 后台客户详情页假数据，C3 由 src/lib/db/ 替换后删除
import type { BalanceView, PlanView, TxnView } from "@/types/commerce";

const DAY = 24 * 3600 * 1000;

export function mockPlan(tierId: string, tierName: string): PlanView {
  return {
    tierId,
    tierName,
    currency: "EUR",
    billing: "STRIPE",
    baseFee: 9900,
    extraPlatforms: ["x", "youtube"],
    extraPlatformFee: 3000,
    allInclusiveFee: null,
    monthlyCredits: 60,
    monthlyVideos: 4,
    topupUnitPrice: 100,
    status: "PENDING_PAYMENT",
    currentPeriodEnd: null,
  };
}

export function mockBalance(): BalanceView {
  return { total: 49, monthly: { remaining: 37, amount: 60, expiresAt: new Date(Date.now() + 17 * DAY) }, templateOnly: 2, lasting: 10, videos: { remaining: 3, amount: 4 } };
}

export function mockTxns(): TxnView[] {
  const now = Date.now();
  return [
    { id: "t1", kind: "DEBIT", charge: "AI_HD", source: null, delta: -2, note: null, createdAt: new Date(now - 2 * 3600 * 1000) },
    { id: "t2", kind: "DEBIT", charge: "TEMPLATE_EXPORT", source: null, delta: -1, note: null, createdAt: new Date(now - DAY) },
    { id: "t3", kind: "GRANT", charge: null, source: "MONTHLY", delta: 60, note: null, createdAt: new Date(now - 13 * DAY) },
  ];
}

export function mockCustomer() {
  return { id: "demo-customer", name: "Marco Rossi", email: "marco@trattoria-rossi.it", shopName: "Trattoria Rossi" };
}
