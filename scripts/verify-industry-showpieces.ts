import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { SHOWPIECES, getShowpieces } from "../src/lib/verticals/showpieces";
import { getVerticalConfig } from "../src/lib/verticals/config";

const unique = new Set<string>();
const supported = ["nails","roofing"] as const;
let total=0;
for (const industry of supported) {
  const config=getVerticalConfig(industry)!;
  for (const goal of config.goals) {
    const pieces=getShowpieces(industry,goal.id);
    assert.equal(pieces.length,2,`${industry}/${goal.id} must contain 2 real designed samples`);
    assert.deepEqual(pieces.map(x=>x.variant),["A","B"]);
    assert.notEqual(pieces[0].layout,pieces[1].layout,`${industry}/${goal.id}: layouts must vary`);
    assert.notEqual(pieces[0].headline,pieces[1].headline,`${industry}/${goal.id}: headline must vary`);
    for (const piece of pieces) {
      assert.ok(!unique.has(piece.id),`duplicate creative ID: ${piece.id}`);
      unique.add(piece.id);
      assert.ok(piece.headline && piece.bodyCopy.length>100 && piece.cta);
      assert.ok(piece.image && piece.imageCredit && piece.photographyNotice);
      assert.ok(piece.visualReason && piece.outcome && piece.evidenceNeeded.length >= 2);
      assert.ok(!/\b(20%|50% OFF|guaranteed results|100% guaranteed|five-star)\b/i.test(piece.bodyCopy),
        "No fabricated discounts, results or endorsements in demo");
      if (industry==="roofing") {
        assert.ok(piece.image.startsWith("https://images.unsplash.com/photo-"));
        assert.match(piece.photographyNotice,/并非 NORTH ROOFING/);
      } else {
        assert.ok(piece.image.startsWith("/demo/photos/nail-"));
      }
      total++;
    }
  }
}
assert.equal(total,22);
assert.equal(SHOWPIECES.length,22);
assert.equal(getShowpieces("accounting","consult").length,0);
const css=readFileSync("src/components/visual/visual.css","utf8");
const render=readFileSync("src/components/visual/industry-showpiece-poster.tsx","utf8");
const picker=readFileSync("src/components/visual/marketing-goal-picker.tsx","utf8");
for(const piece of SHOWPIECES) assert.ok(css.includes(".isp--"+piece.layout),`missing art direction ${piece.layout}`);
assert.ok(render.includes("isp-photo") && render.includes("isp-headline"));
assert.ok(picker.includes("getShowpieces") && picker.includes("创意方案 B"));
assert.ok(picker.includes("sample.photographyNotice") && !picker.includes("sample.bodyCopy"),
  "Do not expose internal ad copy layers in customer modal");
console.log(`Phase 3 PASS: ${total} creative variants, ${new Set(SHOWPIECES.map(x=>x.layout)).size} distinct layouts, ${supported.length} industry libraries, evidence + photography disclosures`);
