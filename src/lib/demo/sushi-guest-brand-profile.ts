import type { DemoSession } from "./contracts";
import { newBrandProfileDraft, type BrandProfileDraft } from "../content-engine/brand-profile";

/**
 * An anonymous, device-local, unapproved draft made from facts supplied by the
 * restaurant. Never treat this as server onboarding, merchant identification
 * or permission to publish.
 */
export function generateSushiGuestBrandProfile(input: {
  session: DemoSession;
  businessName: string;
  serviceArea: string;
  locale: "zh"|"en";
  rightsAttested: boolean;
}): BrandProfileDraft | null {
  if (input.session.industryId!=="sushi" || !input.businessName.trim() ||
      !input.serviceArea.trim()) return null;
  const now=input.session.updatedAt;
  const profile=newBrandProfileDraft({
    tenantId:input.session.id,
    profileId:input.session.id,
    industry:"sushi",
    businessName:input.businessName.trim().slice(0,55),
    serviceArea:input.serviceArea.trim().slice(0,120),
    locale:input.locale,
    now,
  });
  profile.assets=input.session.assets.map(asset=>({
    assetId:asset.id,
    kind:"product" as const, // Unclassified demo photo; PoStory must classify on intake.
    originalStorageKey:`demo-local/${asset.storageKey}`,
    sha256:asset.contentHash,
    sourcePermission:"needs_confirmation" as const,
    approvedForPublishing:false,
  }));
  // General photo-rights attestation is not sufficient to approve each asset.
  // Only preserve this as a candidate fact for later operator verification.
  if(input.rightsAttested)profile.factualClaims.push({
    key:"photoRightsAttestedInDemo",
    fact:{value:"yes; individual licenses unverified",status:"proposed",source:"merchant_form"}
  });
  return profile;
}
