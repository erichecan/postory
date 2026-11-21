import { strict as assert } from "node:assert";
import { assertTextGlyphCoverage } from "../src/lib/publishing/font-coverage";

function run() {
  process.env.NODE_ENV = "production";
  // Probe actual glyph coverage of every language promised by the service.
  assertTextGlyphCoverage("SUSHI LUNCH ↗");
  assertTextGlyphCoverage("寿司 午餐 预约");
  assertTextGlyphCoverage("すし 寿司 おすすめ");
  assert.throws(() => assertTextGlyphCoverage("\u0378"), /missing_font_glyph/);
  console.log("Container font coverage PASS: English, Simplified Chinese, Japanese, arrows; unknown glyph rejected.");
}
run();
