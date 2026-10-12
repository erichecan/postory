import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { TemplateRenderer } from "@/components/demo/templates/template-renderer";
import { OUTPUT_SPECS, TEMPLATE_RATIO_IDS } from "@/lib/demo/contracts";
import { SUSHI_SIGNATURE_EDITORIAL_01 } from "../sushi-signature-editorial-01";
import { SUSHI_EDITORIAL_VARIANTS } from "../sushi-editorial-variants";
import { TEMPLATE_DESCRIPTORS } from "../descriptors";

const fields = { title: "Fresh\nSushi", shortCopy: "SIMPLE INGREDIENTS\nEXTRAORDINARY TASTE" };

function render(mode: "thumbnail" | "preview" | "export", outputId: "square" | "portrait-4x5" | "story-9x16") {
  return renderToStaticMarkup(createElement(TemplateRenderer, {
    templateId: SUSHI_SIGNATURE_EDITORIAL_01.id,
    photoUrl: "/demo/photos/sushi-salmon-nigiri.png",
    fields,
    outputId,
    mode,
  }));
}

describe("sushi-signature-editorial-01", () => {
  it("is a validated, versioned registry template with all three requested ratios", () => {
    assert.equal(SUSHI_SIGNATURE_EDITORIAL_01.id, "sushi-signature-editorial-01");
    assert.equal(SUSHI_SIGNATURE_EDITORIAL_01.version, "1.0.0");
    assert.deepEqual([...TEMPLATE_RATIO_IDS].sort(), ["portrait-4x5", "square", "story-9x16"]);
    assert.deepEqual(
      Object.fromEntries(Object.entries(SUSHI_SIGNATURE_EDITORIAL_01.layouts).map(([id, layout]) => [id, [layout.width, layout.height]])),
      {
        square: [OUTPUT_SPECS.square.width, OUTPUT_SPECS.square.height],
        "portrait-4x5": [OUTPUT_SPECS["portrait-4x5"].width, OUTPUT_SPECS["portrait-4x5"].height],
        "story-9x16": [OUTPUT_SPECS["story-9x16"].width, OUTPUT_SPECS["story-9x16"].height],
      },
    );
  });

  it("keeps every declared layer within its ratio artboard", () => {
    for (const layout of Object.values(SUSHI_SIGNATURE_EDITORIAL_01.layouts)) {
      for (const box of [layout.photo, layout.overlay, layout.headline, layout.tagline, layout.ornamentTop, layout.ornamentBottom, layout.accentBrush, layout.watermarkSafeArea]) {
        assert.ok(box.x >= 0 && box.y >= 0);
        assert.ok(box.x + box.width <= 1.001, `x overflow: ${box.x + box.width}`);
        assert.ok(box.y + box.height <= 1.001, `y overflow: ${box.y + box.height}`);
      }
    }
  });

  it("uses the same photo, text and layer tree for thumbnail, preview and export", () => {
    const thumbnail = render("thumbnail", "portrait-4x5");
    const preview = render("preview", "portrait-4x5");
    const exported = render("export", "portrait-4x5");
    const composition = (html: string) => html
      .replace('data-template-mode="thumbnail"', "")
      .replace('data-template-mode="preview"', "")
      .replace('data-template-mode="export"', "");
    assert.equal(composition(thumbnail), composition(preview));
    assert.equal(composition(preview), composition(exported));
    assert.match(preview, /sushi-signature-editorial-01/);
    assert.match(preview, /data-template-slot="hero"/);
    assert.match(preview, /data-template-slot="headline"/);
    assert.match(preview, /data-template-slot="tagline"/);
    assert.match(preview, /assets\/accent-brush\.png/);
    assert.ok(!preview.includes("TemplateSelectionBadge"));
  });

  it("supports an empty optional tagline without reserving its text layer", () => {
    const html = renderToStaticMarkup(createElement(TemplateRenderer, {
      templateId: SUSHI_SIGNATURE_EDITORIAL_01.id,
      photoUrl: "/demo/photos/sushi-salmon-nigiri.png",
      fields: { title: "Fresh\nSushi", shortCopy: "" },
      outputId: "square",
      mode: "preview",
    }));
    assert.match(html, /data-template-slot="headline"/);
    assert.ok(!html.includes('data-template-slot="tagline"'));
  });

  it("registers the other five Sushi templates as versioned code templates", () => {
    assert.equal(Object.keys(SUSHI_EDITORIAL_VARIANTS).length, 5);
    for (const definition of Object.values(SUSHI_EDITORIAL_VARIANTS)) {
      assert.equal(definition.version, "1.0.0");
      assert.ok(TEMPLATE_DESCRIPTORS[definition.id]);
      assert.equal(TEMPLATE_DESCRIPTORS[definition.id].adapterId, "react-layered-template");
      for (const ratio of TEMPLATE_RATIO_IDS) {
        const markupForMode = (mode: "thumbnail" | "preview" | "export") => renderToStaticMarkup(createElement(TemplateRenderer, {
          templateId: definition.id,
          photoUrl: "/demo/photos/sushi-salmon-nigiri.png",
          fields: { title: definition.headlineDefault, shortCopy: definition.taglineDefault },
          outputId: ratio,
          mode,
        }));
        const markup = markupForMode("preview");
        assert.match(markup, new RegExp(`data-template-id="${definition.id}"`));
        assert.match(markup, new RegExp(`data-output-id="${ratio}"`));
        assert.match(markup, /data-template-slot="hero"/);
        assert.match(markup, /data-template-slot="headline"/);
        assert.match(markup, /data-template-slot="tagline"/);
        assert.ok(!markup.includes("sushi-template-"), "flattened reference art must not be used as runtime artwork");
        const withoutMode = (value: string) => value.replace(/data-template-mode="(?:thumbnail|preview|export)"/g, "");
        assert.equal(withoutMode(markupForMode("thumbnail")), withoutMode(markupForMode("preview")));
        assert.equal(withoutMode(markupForMode("preview")), withoutMode(markupForMode("export")));
      }
    }
  });
});
