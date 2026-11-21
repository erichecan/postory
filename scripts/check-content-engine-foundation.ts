import { strict as assert } from "node:assert";
import {
  INDUSTRY_CONFIGS, getIndustryConfig, industrySupportsGoal, industrySupportsPromotion,
} from "../src/lib/content-engine/industry-registry";
import {
  checkBrandProfileForApproval, confirmedBrandFacts, newBrandProfileDraft,
} from "../src/lib/content-engine/brand-profile";

const industryList = Object.values(INDUSTRY_CONFIGS);
assert.ok(industryList.length >= 2, "need distinct industry configs");
for (const industry of industryList) {
  assert.ok(industry.customerPath.startsWith("/for/"), "industry-specific customer path required");
  assert.equal(industry.slug, industry.customerPath.split("/").at(-1));
  assert.ok(industry.goals.length >= 3, "industry must provide goals");
  assert.ok(industry.promotionTypes.includes("none"), "non-discount option required");
  assert.equal(new Set(industry.goals.map((goal) => goal.id)).size, industry.goals.length);
  assert.equal(new Set(industry.promotionTypes).size, industry.promotionTypes.length);
}
assert.equal(getIndustryConfig("does-not-exist"), null);
assert.ok(industrySupportsGoal("sushi", "lunch_traffic"));
assert.ok(!industrySupportsGoal("roofing", "lunch_traffic"));
assert.ok(industrySupportsPromotion("sushi", "buy_x_get_y"));
assert.ok(!industrySupportsPromotion("roofing", "buy_x_get_y"));
assert.notDeepEqual(INDUSTRY_CONFIGS.sushi.goals, INDUSTRY_CONFIGS.roofing.goals);

const draft = newBrandProfileDraft({
  tenantId: "tenant-1", profileId: "brand-1", industry: "sushi",
  businessName: "Sakura Sushi", serviceArea: "Toronto", locale: "en", now: "2026-11-21T12:00:00Z",
});
assert.equal(draft.status, "draft");
assert.equal(checkBrandProfileForApproval(draft).canApprove, false, "AI/draft must not auto-approve");
assert.deepEqual(confirmedBrandFacts(draft), {}, "proposed facts must not enter publishable copy");
draft.businessName.status = "merchant_confirmed";
draft.serviceArea.status = "merchant_confirmed";
draft.preferredLocale.status = "merchant_confirmed";
draft.factualClaims.push({ key: "signatureItem", fact: {
  value: "Salmon roll", status: "merchant_confirmed", source: "merchant_form",
}});
draft.factualClaims.push({ key: "claimFromAI", fact: {
  value: "Best sushi in Toronto", status: "proposed", source: "ai_extraction",
}});
assert.equal(checkBrandProfileForApproval(draft).canApprove, true);
assert.equal(confirmedBrandFacts(draft).signatureItem, "Salmon roll");
assert.equal(confirmedBrandFacts(draft).claimFromAI, undefined);
draft.assets.push({ assetId: "photo-1", kind: "product", originalStorageKey: "a/b.jpg", sha256: "f".repeat(64), sourcePermission: "needs_confirmation", approvedForPublishing: true });
assert.ok(checkBrandProfileForApproval(draft).blockers.includes("unlicensed_asset_approved"));
console.log("Content engine foundation checks PASS: industry separation, promotion policy, Brand Profile fact gating and asset licensing.");
