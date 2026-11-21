import type { IndustrySlug } from "./industry-registry";

/**
 * Domain-only contract. No database writes, AI extraction or upload endpoint
 * is implemented by this file. All publishable facts require merchant approval.
 */
export type BrandFactStatus = "proposed" | "merchant_confirmed" | "designer_selected" | "rejected";
export type BrandFactSource = "merchant_form" | "uploaded_asset" | "ai_extraction" | "designer_review";
export type BrandAssetKind = "logo" | "storefront" | "interior" | "product" | "service" | "team" | "project";
export type BrandProfileStatus = "draft" | "pending_review" | "approved" | "superseded";

export type BrandField<T> = {
  value: T;
  status: BrandFactStatus;
  source: BrandFactSource;
  sourceAssetId?: string;
  reviewedAt?: string;
  reviewedBy?: string;
};

export type BrandAssetReference = {
  assetId: string;
  kind: BrandAssetKind;
  originalStorageKey: string;
  optimizedStorageKey?: string;
  sha256: string;
  sourcePermission: "merchant_owned" | "merchant_licensed" | "needs_confirmation";
  photoCaption?: string;
  processingVersion?: string;
  approvedForPublishing: boolean;
};

export type BrandProfileDraft = {
  schemaVersion: 1;
  tenantId: string;
  profileId: string;
  industry: IndustrySlug;
  version: number;
  status: BrandProfileStatus;
  businessName: BrandField<string>;
  serviceArea: BrandField<string>;
  preferredLocale: BrandField<"zh" | "en">;
  brandColors?: BrandField<string[]>;
  typographyDirection?: BrandField<string>;
  writingVoice?: BrandField<string>;
  positioning?: BrandField<string>;
  factualClaims: Array<{
    key: string;
    fact: BrandField<string>;
  }>;
  prohibitedClaims: string[];
  assets: BrandAssetReference[];
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  approvedBy?: string;
};

export type BrandProfileCheck = {
  canApprove: boolean;
  blockers: string[];
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;
const SHA256 = /^[a-f0-9]{64}$/i;

export function checkBrandProfileForApproval(profile: BrandProfileDraft): BrandProfileCheck {
  const blockers: string[] = [];
  if (!profile.tenantId.trim() || !profile.profileId.trim()) blockers.push("missing_tenant_or_profile");
  if (!profile.businessName.value.trim() || profile.businessName.status !== "merchant_confirmed") {
    blockers.push("business_name_not_confirmed");
  }
  if (!profile.serviceArea.value.trim() || profile.serviceArea.status !== "merchant_confirmed") {
    blockers.push("service_area_not_confirmed");
  }
  if (profile.preferredLocale.status !== "merchant_confirmed") blockers.push("locale_not_confirmed");
  if (!Number.isInteger(profile.version) || profile.version < 1) blockers.push("invalid_version");
  if (!ISO_DATE.test(profile.updatedAt) || !ISO_DATE.test(profile.createdAt)) blockers.push("invalid_timestamps");
  for (const asset of profile.assets) {
    if (!asset.assetId.trim() || !asset.originalStorageKey.trim() || !SHA256.test(asset.sha256)) {
      blockers.push("invalid_asset_metadata");
    }
    if (asset.approvedForPublishing && asset.sourcePermission === "needs_confirmation") {
      blockers.push("unlicensed_asset_approved");
    }
  }
  for (const claim of profile.factualClaims) {
    if (claim.fact.status === "merchant_confirmed" && !claim.fact.value.trim()) blockers.push("empty_confirmed_claim");
  }
  return { canApprove: blockers.length === 0, blockers: [...new Set(blockers)] };
}

/** Never include inferred or unapproved claims in copy or offer generation. */
export function confirmedBrandFacts(profile: BrandProfileDraft): Record<string, string> {
  const facts: Record<string, string> = {};
  if (profile.businessName.status === "merchant_confirmed") facts.businessName = profile.businessName.value;
  if (profile.serviceArea.status === "merchant_confirmed") facts.serviceArea = profile.serviceArea.value;
  for (const item of profile.factualClaims) {
    if (item.fact.status === "merchant_confirmed" && item.fact.value.trim()) {
      facts[item.key] = item.fact.value;
    }
  }
  return facts;
}

/** Construct only a DRAFT. No source inference can approve itself. */
export function newBrandProfileDraft(input: {
  tenantId: string;
  profileId: string;
  industry: IndustrySlug;
  businessName: string;
  serviceArea: string;
  locale: "zh" | "en";
  now: string;
}): BrandProfileDraft {
  return {
    schemaVersion: 1,
    tenantId: input.tenantId,
    profileId: input.profileId,
    industry: input.industry,
    version: 1,
    status: "draft",
    businessName: { value: input.businessName, status: "proposed", source: "merchant_form" },
    serviceArea: { value: input.serviceArea, status: "proposed", source: "merchant_form" },
    preferredLocale: { value: input.locale, status: "proposed", source: "merchant_form" },
    factualClaims: [],
    prohibitedClaims: [],
    assets: [],
    createdAt: input.now,
    updatedAt: input.now,
  };
}
