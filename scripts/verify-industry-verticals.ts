import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { getVerticalConfig, validatePromotion, VERTICAL_SLUGS } from "../src/lib/verticals/config";

assert.deepEqual(VERTICAL_SLUGS, ["sushi","nails","roofing","accounting","fitness","retail"]);
const names = new Set<string>();
for (const slug of VERTICAL_SLUGS) {
  const vertical = getVerticalConfig(slug)!;
  assert.equal(vertical.slug, slug);
  assert.ok(vertical.goals.length >= 5, slug + " needs at least 5 marketing goals");
  assert.ok(vertical.goals.length <= 7, slug + " must not force 7 for every industry");
  assert.ok(vertical.promotions.length >= 3, slug + " needs unique promotion rules");
  assert.ok(vertical.copyRules.length && vertical.imageRules.length, slug + " must have creative rules");
  const ids = vertical.goals.map(x=>x.id);
  assert.equal(ids.length, new Set(ids).size, slug + " duplicate goal IDs");
  assert.ok(vertical.goals.every(g=>g.creative.headline && g.creative.description));
  assert.ok(vertical.promotions.every(p=>p.requiredFacts.length > 0));
  assert.ok(validatePromotion(vertical, vertical.promotions[0].id, {}).length > 0, slug + " cannot accept unverified offer");
  const verified = Object.fromEntries(vertical.promotions[0].requiredFacts.map(f=>[f,"confirmed"]));
  assert.deepEqual(validatePromotion(vertical, vertical.promotions[0].id, verified),[]);
  names.add(vertical.demoName);
  console.log(slug + ": " + vertical.goals.length + " goals, " + vertical.promotions.length + " rule-based campaigns");
}
assert.equal(names.size, 6, "Each industry must have a different demo brand");
assert.equal(getVerticalConfig("__unknown__"), undefined);
const route = readFileSync("src/app/for/[industry]/page.tsx", "utf8");
const proxy = readFileSync("src/proxy.ts", "utf8");
const experience = readFileSync("src/components/visual/store-marketing-experience.tsx", "utf8");
const picker = readFileSync("src/components/visual/marketing-goal-picker.tsx", "utf8");
assert.ok(route.includes("getVerticalConfig") && route.includes("StoreMarketingExperience"));
assert.ok(proxy.includes('pathname) ||') && proxy.includes('/for'), "Public industry links cannot require login");
assert.ok(experience.includes("postory-industry-brief-v1-"), "Drafts must be isolated by industry");
assert.ok(experience.includes("vertical ? null :"), "No industry dropdown on dedicated link");
assert.ok(experience.includes("step === 6 && vertical"), "Customer flow must not open the internal content calendar");
assert.ok(picker.includes("SushiCampaignPoster") && picker.includes("storex-goal-list"), "Preserve original Sakura five-step layout");
assert.ok(picker.includes("vertical?.demoName") && picker.includes("industryGoal"), "Cases must match vertical");
console.log("Six industry-specific public entry routes and isolated goal/promotion journeys verified");
