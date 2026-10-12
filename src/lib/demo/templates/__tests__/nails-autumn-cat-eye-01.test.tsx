import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { TemplateRenderer } from "@/components/demo/templates/template-renderer";
import { OUTPUT_SPECS, TEMPLATE_RATIO_IDS } from "@/lib/demo/contracts";
import { NAILS_AUTUMN_CAT_EYE_01 } from "../nails-autumn-cat-eye-01";
import { NAILS_EDITORIAL_VARIANTS, NAILS_TEMPLATE_IDS } from "../nails-editorial-variants";
import { TEMPLATE_DESCRIPTORS } from "../descriptors";

const fields = { title: "秋日猫眼\n新品上线", shortCopy: "一抹流光，点亮秋日" };

function render(mode: "thumbnail" | "preview" | "export", outputId: "square" | "portrait-4x5" | "story-9x16") {
  return renderToStaticMarkup(createElement(TemplateRenderer, {
    templateId: NAILS_AUTUMN_CAT_EYE_01.id,
    photoUrl: "/demo/templates/nails/assets/hero-autumn-cat-eye-sample.png",
    fields,
    outputId,
    mode,
  }));
}

describe("nails-autumn-cat-eye-01", () => {
  it("is a versioned Nail template registered with three independent output layouts", () => {
    assert.equal(NAILS_AUTUMN_CAT_EYE_01.id, "nails-autumn-cat-eye-01");
    assert.equal(NAILS_AUTUMN_CAT_EYE_01.version, "1.0.1");
    assert.deepEqual([...TEMPLATE_RATIO_IDS].sort(), ["portrait-4x5", "square", "story-9x16"]);
    assert.equal(TEMPLATE_DESCRIPTORS[NAILS_AUTUMN_CAT_EYE_01.id].adapterId, "react-layered-template");
    assert.deepEqual(Object.fromEntries(Object.entries(NAILS_AUTUMN_CAT_EYE_01.layouts).map(([id, layout]) => [id, [layout.width, layout.height]])), {
      square: [OUTPUT_SPECS.square.width, OUTPUT_SPECS.square.height],
      "portrait-4x5": [OUTPUT_SPECS["portrait-4x5"].width, OUTPUT_SPECS["portrait-4x5"].height],
      "story-9x16": [OUTPUT_SPECS["story-9x16"].width, OUTPUT_SPECS["story-9x16"].height],
    });
  });

  it("keeps all image, text, decoration and watermark areas inside each artboard", () => {
    for (const layout of Object.values(NAILS_AUTUMN_CAT_EYE_01.layouts)) {
      for (const box of [layout.photo, layout.overlay, layout.headline, layout.tagline, layout.ornamentTop, layout.ornamentBottom, layout.accentBrush, layout.watermarkSafeArea]) {
        assert.ok(box.x >= 0 && box.y >= 0);
        assert.ok(box.x + box.width <= 1.001);
        assert.ok(box.y + box.height <= 1.001);
      }
    }
  });

  it("uses one composition for thumbnail, live preview and export at every ratio", () => {
    for (const ratio of TEMPLATE_RATIO_IDS) {
      const withoutMode = (value: string) => value.replace(/data-template-mode="(?:thumbnail|preview|export)"/g, "");
      const thumbnail = render("thumbnail", ratio);
      const preview = render("preview", ratio);
      const exported = render("export", ratio);
      assert.equal(withoutMode(thumbnail), withoutMode(preview), ratio);
      assert.equal(withoutMode(preview), withoutMode(exported), ratio);
      assert.match(preview, new RegExp(`data-output-id="${ratio}"`));
      assert.match(preview, /data-template-slot="hero"/);
      assert.match(preview, /data-template-slot="headline"/);
      assert.match(preview, /data-template-slot="tagline"/);
      assert.match(preview, /autumn-leaf-upper\.svg/);
      assert.match(preview, /autumn-leaf-lower\.svg/);
      assert.match(preview, /accent-brush\.svg/);
    }
  });

  it("allows hiding optional tagline without changing the photo or headline slots", () => {
    const html = renderToStaticMarkup(createElement(TemplateRenderer, {
      templateId: NAILS_AUTUMN_CAT_EYE_01.id,
      photoUrl: "/demo/templates/nails/assets/hero-autumn-cat-eye-sample.png",
      fields: { title: fields.title, shortCopy: "" },
      outputId: "portrait-4x5",
      mode: "preview",
    }));
    assert.match(html, /data-template-slot="hero"/);
    assert.match(html, /data-template-slot="headline"/);
    assert.ok(!html.includes('data-template-slot="tagline"'));
  });

  it("registers six editable Nail templates and keeps each composition identical across renderer modes", () => {
    assert.equal(NAILS_TEMPLATE_IDS.length, 6);
    for (const [id, definition] of Object.entries(NAILS_EDITORIAL_VARIANTS)) {
      assert.ok(TEMPLATE_DESCRIPTORS[id], `${id} descriptor`);
      assert.equal(TEMPLATE_DESCRIPTORS[id].adapterId, "react-layered-template");
      for (const ratio of TEMPLATE_RATIO_IDS) {
        const modeMarkup = (mode: "thumbnail" | "preview" | "export") => renderToStaticMarkup(createElement(TemplateRenderer, {
          templateId: id,
          photoUrl: "/demo/templates/nails/assets/hero-glazed-pearl-sample.webp",
          fields: { title: definition.slots[1].type === "text" ? definition.slots[1].defaultValue : "Sample", shortCopy: "Sample copy" },
          outputId: ratio,
          mode,
        }));
        const withoutMode = (html: string) => html.replace(/data-template-mode="(?:thumbnail|preview|export)"/g, "");
        assert.equal(withoutMode(modeMarkup("thumbnail")), withoutMode(modeMarkup("preview")), `${id} ${ratio} thumbnail`);
        assert.equal(withoutMode(modeMarkup("preview")), withoutMode(modeMarkup("export")), `${id} ${ratio} export`);
        const html = modeMarkup("preview");
        assert.match(html, new RegExp(`data-template-id="${id}"`));
        assert.match(html, new RegExp(`data-output-id="${ratio}"`));
        assert.match(html, /data-template-slot="hero"/);
        assert.match(html, /data-template-slot="headline"/);
        assert.match(html, /data-template-slot="tagline"/);
      }
    }
  });
});
