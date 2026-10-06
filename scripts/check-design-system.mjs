import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const loadPackage = createRequire(import.meta.url);
const { chromium } = loadPackage("playwright");
const output = path.resolve(
  process.env.VISUAL_OUTPUT_DIR || "preview/design-system",
);
const base = process.env.VISUAL_BASE_URL || "http://localhost:3002";
assert.equal(
  /\b(?:font(?:-[a-z-]+)?|line-height|letter-spacing)\s*:/.test(
    fs.readFileSync("src/components/visual/visual.css", "utf8"),
  ),
  false,
  "Page layout CSS must not contain typography overrides",
);
const routes = [
  "/",
  "/our-work",
  "/our-work/beauty",
  "/our-work/restaurant",
  "/our-work/contractor",
  "/services",
  "/how-it-works",
  "/who-we-help",
  "/about",
  "/assessment",
  "/demo/dashboard",
  "/demo/my-campaign",
  "/demo/my-campaign/spring-beauty-refresh",
  "/demo/calendar",
  "/demo/my-brand",
];
(async () => {
  const b = await chromium.launch({
    headless: true,
    ...(process.env.CHROME_PATH
      ? { executablePath: process.env.CHROME_PATH }
      : {}),
  });
  const report = [];
  for (const w of [1440, 768, 390])
    for (const url of routes) {
      const p = await b.newPage({ viewport: { width: w, height: 900 } });
      await p.goto(base + url, { waitUntil: "networkidle" });
      const m = await p.evaluate(() => {
        const title = document.querySelector(
          ".ps-public>section h1,.ps-client-main h1",
        );
        const body = document.querySelector(".ps");
        const button = document.querySelector(
          ".ps-actions .ps-button,.ps-campaign-hero .ps-button,.ps-feedback .ps-button",
        );
        return {
          h1: getComputedStyle(title).fontSize,
          h1Weight: getComputedStyle(title).fontWeight,
          fontFamily: getComputedStyle(body).fontFamily,
          headerHeight: document.querySelector("header").getBoundingClientRect()
            .height,
          button: button
            ? {
                font: getComputedStyle(button).fontSize,
                minHeight: getComputedStyle(button).minHeight,
              }
            : null,
        };
      });
      const customer = url.startsWith("/demo/");
      assert.equal(
        m.h1,
        customer
          ? w < 701
            ? "28px"
            : "32px"
          : w < 701
            ? "36px"
            : w < 901
              ? "40px"
              : "48px",
      );
      assert.equal(m.h1Weight, "700");
      assert.equal(m.headerHeight, w < 701 ? 64 : 72);
      if (m.button) {
        assert.equal(m.button.font, "14px");
        assert.equal(m.button.minHeight, "48px");
      }
      report.push({ url, width: w, ...m });
      await p.close();
    }
  fs.mkdirSync(output, { recursive: true });
  fs.writeFileSync(
    path.join(output, "typography-report.json"),
    JSON.stringify(report, null, 2),
  );
  console.log("PASS shared typography/header/button roles", report.length);
  await b.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
