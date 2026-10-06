/** Read-only browser verification for the supplied reference UI. */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const loadPackage = createRequire(import.meta.url);
const { chromium } = loadPackage("playwright");
const base = process.env.VISUAL_BASE_URL || "http://localhost:3002";
const output = path.resolve(
  process.env.VISUAL_OUTPUT_DIR || "preview/visual-validation",
);
const routes = [
  ["home", "/", 801],
  ["work", "/our-work", 1536],
  ["beauty", "/our-work/beauty", 1024],
  ["restaurant", "/our-work/restaurant", 1024],
  ["contractor", "/our-work/contractor", 1024],
  ["services", "/services", 1024],
  ["process", "/how-it-works", 1024],
  ["industries", "/who-we-help", 1024],
  ["about", "/about", 1024],
  ["assessment", "/assessment", 1024],
  ["dashboard", "/demo/dashboard", 1536],
  ["campaigns", "/demo/my-campaign", 1536],
  ["detail", "/demo/my-campaign/spring-beauty-refresh", 1024],
  ["calendar", "/demo/calendar", 1536],
  ["brand", "/demo/my-brand", 1024],
];
(async () => {
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROME_PATH
      ? { executablePath: process.env.CHROME_PATH }
      : {}),
  });
  const context = await browser.newContext({ deviceScaleFactor: 1 });
  const desktop = [],
    responsive = [];
  try {
    for (const mode of ["desktop", 390, 375, 768, 1280, 1440])
      for (const [key, url, referenceWidth] of routes) {
        const width =
          mode === "desktop"
            ? Number(process.env.VISUAL_DESKTOP_WIDTH || referenceWidth)
            : mode;
        const height =
          mode === "desktop"
            ? width === 1536
              ? 1024
              : 900
            : { 390: 844, 375: 812, 768: 1024, 1280: 800, 1440: 900 }[width];
        const page = await context.newPage();
        await page.setViewportSize({ width, height });
        const errors = [];
        page.on("pageerror", (error) => errors.push(error.message));
        const response = await page.goto(base + url, {
          waitUntil: "networkidle",
          timeout: 90000,
        });
        await page.evaluate(() => document.fonts.ready);
        const measurements = await page.evaluate(() => ({
          height: document.documentElement.scrollHeight,
          width: document.documentElement.scrollWidth,
          fonts: document.fonts.check("16px Inter"),
          brokenImages: [...document.images]
            .filter(
              (i) =>
                i.getClientRects().length && (!i.complete || !i.naturalWidth),
            )
            .map((i) => i.src),
        }));
        const row = {
          key,
          url,
          viewport: [width, height],
          status: response.status(),
          errors,
          ...measurements,
        };
        (mode === "desktop" ? desktop : responsive).push(row);
        if (mode === "desktop") {
          await page.screenshot({
            path: path.join(output, key + "-desktop.png"),
            fullPage: true,
          });
          await page.screenshot({
            path: path.join(output, key + "-first-screen.png"),
          });
        }
        if (mode === 390)
          await page.screenshot({
            path: path.join(output, key + "-mobile.png"),
            fullPage: true,
          });
        if (
          row.status !== 200 ||
          row.width > width ||
          errors.length ||
          row.brokenImages.length
        )
          process.exitCode = 1;
        console.log(
          `${key} ${width}×${height}: ${row.status}, overflow=${row.width - width}, broken=${row.brokenImages.length}, errors=${errors.length}`,
        );
        await page.close();
      }
    fs.writeFileSync(
      path.join(output, "desktop-report.json"),
      JSON.stringify(desktop, null, 2),
    );
    fs.writeFileSync(
      path.join(output, "responsive-report.json"),
      JSON.stringify(responsive, null, 2),
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
