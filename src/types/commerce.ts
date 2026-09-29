export type Currency = "EUR" | "CAD";
export type PlanStatus = "DRAFT" | "PENDING_PAYMENT" | "ACTIVE" | "PAST_DUE" | "CANCELED";
export type PlanBilling = "STRIPE" | "OFFLINE";
export type GrantSource = "SIGNUP_GIFT" | "MONTHLY" | "TOPUP" | "ADMIN" | "REFUND_RETURN";
export type TxnKind = "GRANT" | "DEBIT" | "REFUND" | "EXPIRE" | "ADJUST";
export type ChargeKind = "TEMPLATE_EXPORT" | "AI_STANDARD" | "AI_HD";

export type TierView = {
  id: string;
  name: string;
  benefits: string[];
  defaultMonthlyCredits: number;
  defaultMonthlyVideos: number;
};

export type PlanFees = {
  baseFee: number;
  extraPlatforms: string[];
  extraPlatformFee: number;
  allInclusiveFee: number | null;
};

export type PlanView = PlanFees & {
  tierId: string;
  tierName: string;
  currency: Currency;
  billing: PlanBilling;
  monthlyCredits: number;
  monthlyVideos: number;
  topupUnitPrice: number;
  status: PlanStatus;
  currentPeriodEnd: Date | null;
};

export type BalanceView = {
  total: number;
  monthly: { remaining: number; amount: number; expiresAt: Date | null } | null;
  templateOnly: number;
  lasting: number;
  videos: { remaining: number; amount: number } | null;
};

export type TxnView = {
  id: string;
  kind: TxnKind;
  charge: ChargeKind | null;
  source: GrantSource | null;
  delta: number;
  note: string | null;
  createdAt: Date;
};
