import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { TEMPLATE_RATIO_IDS } from "@/lib/demo/contracts";
import { NAILS_AUTUMN_CAT_EYE_01 } from "../nails-autumn-cat-eye-01";
import { NAILS_EDITORIAL_VARIANTS, NAILS_TEMPLATE_DEFAULTS } from "../nails-editorial-variants";
import { SUSHI_SIGNATURE_EDITORIAL_01 } from "../sushi-signature-editorial-01";
import { SUSHI_EDITORIAL_VARIANTS } from "../sushi-editorial-variants";

function loadDefinition(industry: "nails" | "sushi", id: string) {
  return JSON.parse(readFileSync(join(process.cwd(), "public", "demo", "templates", industry, `${id}.v1.json`), "utf8")) as Record<string, any>;
}

function assertPublicAsset(url: string) {
  assert.ok(url.startsWith("/"), `expected rooted public URL: ${url}`);
  assert.ok(existsSync(join(process.cwd(), "public", url.slice(1))), `missing public asset ${url}`);
}

describe("six-template packs", () => {
  it("keeps all six Nail JSON handoffs aligned with the versioned runtime definitions", () => {
    const definitions = { ...NAILS_EDITORIAL_VARIANTS, [NAILS_AUTUMN_CAT_EYE_01.id]: NAILS_AUTUMN_CAT_EYE_01 };
    assert.equal(Object.keys(definitions).length, 6);
    for (const [id, runtime] of Object.entries(definitions)) {
      const json = loadDefinition("nails", id);
      assert.equal(json.id, runtime.id);
      assert.equal(json.version, runtime.version);
      for (const ratio of TEMPLATE_RATIO_IDS) {
        const a = runtime.layouts[ratio] as any;
        const b = json.layouts[ratio];
        const headline = b.elements?.find((layer: any) => layer.id === "headline")?.rect ?? b.headline;
        const tagline = b.elements?.find((layer: any) => layer.id === "tagline")?.rect ?? b.tagline;
        assert.deepEqual([b.width, b.height], [a.width, a.height], `${id} ${ratio} dimensions`);
        assert.deepEqual([headline.x, headline.y, headline.width, headline.height], [a.headline.x, a.headline.y, a.headline.width, a.headline.height], `${id} ${ratio} headline`);
        assert.deepEqual([tagline.x, tagline.y, tagline.width, tagline.height], [a.tagline.x, a.tagline.y, a.tagline.width, a.tagline.height], `${id} ${ratio} tagline`);
        assert.deepEqual(b.watermarkSafeArea ?? b.watermark?.safeArea, a.watermarkSafeArea, `${id} ${ratio} watermark`);
      }
      const defaults = NAILS_TEMPLATE_DEFAULTS[id as keyof typeof NAILS_TEMPLATE_DEFAULTS];
      assertPublicAsset(defaults.sample);
      for (const url of Object.values(runtime.decorationAssets)) assertPublicAsset(url);
    }
  });

  it("keeps all six Sushi JSON handoffs aligned with the versioned runtime definitions", () => {
    const definitions = { ...SUSHI_EDITORIAL_VARIANTS, [SUSHI_SIGNATURE_EDITORIAL_01.id]: SUSHI_SIGNATURE_EDITORIAL_01 };
    assert.equal(Object.keys(definitions).length, 6);
    for (const [id, runtime] of Object.entries(definitions)) {
      const json = loadDefinition("sushi", id);
      assert.equal(json.id, runtime.id);
      assert.equal(json.version, runtime.version);
      for (const ratio of TEMPLATE_RATIO_IDS) {
        const a = runtime.layouts[ratio] as any;
        const b = json.layouts[ratio];
        assert.deepEqual([b.width, b.height], [a.width, a.height], `${id} ${ratio} dimensions`);
        if ("safeArea" in a) {
          assert.deepEqual(b.headline.rect, a.headline, `${id} ${ratio} headline`);
          assert.deepEqual(b.tagline.rect, a.tagline, `${id} ${ratio} tagline`);
          assert.deepEqual(b.watermark.safeArea, a.safeArea, `${id} ${ratio} watermark`);
        } else {
          const headline = b.elements.find((layer: any) => layer.id === "headline").rect;
          const tagline = b.elements.find((layer: any) => layer.id === "tagline").rect;
          assert.deepEqual([headline.x, headline.y, headline.width, headline.height], [a.headline.x, a.headline.y, a.headline.width, a.headline.height], `${id} ${ratio} headline`);
          assert.deepEqual([tagline.x, tagline.y, tagline.width, tagline.height], [a.tagline.x, a.tagline.y, a.tagline.width, a.tagline.height], `${id} ${ratio} tagline`);
          assert.deepEqual(b.watermarkSafeArea, a.watermarkSafeArea, `${id} ${ratio} watermark`);
        }
      }
      assertPublicAsset(json.assets.heroSample ?? json.assets.samplePhoto);
    }
  });
});
