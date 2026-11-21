import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";

// Screenshot contract: marketing goals remain step 1 in the original five-step
// /store experience. Only right-side creative and case copy may change.
const experience = readFileSync("src/components/visual/store-marketing-experience.tsx", "utf8");
const picker = readFileSync("src/components/visual/marketing-goal-picker.tsx", "utf8");
const store = readFileSync("src/app/store/page.tsx", "utf8");
assert.ok(store.includes("StoreMarketingExperience"), "Keep /store route using original experience");
for (const step of ["营销目的", "门店资料", "营销方式", "商品信息", "发布安排"]) {
  assert.ok(experience.includes(step), "Missing existing 5-step progress label: " + step);
}
for (const id of ["footfall", "promote", "repeat", "basket", "offpeak", "awareness", "unsure"]) {
  assert.ok(experience.includes('id: "' + id + '"'), "Missing marketing goal: " + id);
}
for (const selector of ["storex-step-panel storex-choice-v2", "storex-choice-layout", "storex-goal-list", "storex-case-card", "storex-case-poster-wrap", "storex-case-bottom", "storex-choice-footer", "打开完整案例", "确定目的，继续"]) {
  assert.ok(picker.includes(selector), "Screenshot framework altered: " + selector);
}
assert.ok(picker.includes("<SushiCampaignPoster campaign={example}"), "Right-hand visual preview missing");
console.log("Original /store screenshot framework retained: 5 steps, 7 goals, same 2-column card layout.");
