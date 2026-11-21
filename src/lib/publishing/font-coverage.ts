import { execFileSync } from "node:child_process";

/** Server-side fontconfig preflight for SVG text painted into a raster image.
 * Checks actual Unicode glyph coverage of fonts that will be used by Pango.
 * A rasterized upload has no source text: that still requires visual approval.
 */
const supported = new Map<string, Array<[number, number]>>();

function installedCharset(font: string) {
  const cached = supported.get(font);
  if (cached) return cached;
  const raw = execFileSync("fc-match", ["-f", "%{charset}", font], {
    encoding: "utf8", timeout: 2500, maxBuffer: 1024 * 1024,
  }).trim();
  const ranges = raw.split(/\s+/).filter(Boolean).map((part): [number, number] => {
    const [start, end] = part.split("-");
    const lo = Number.parseInt(start, 16);
    const hi = end ? Number.parseInt(end, 16) : lo;
    if (!Number.isFinite(lo) || !Number.isFinite(hi) || lo > hi) throw new Error("font_charset_unavailable");
    return [lo, hi];
  });
  if (!ranges.length) throw new Error("font_charset_unavailable");
  supported.set(font, ranges);
  return ranges;
}

export function assertTextGlyphCoverage(label: string, force = false): void {
  // macOS development uses system fonts without fontconfig; Cloud Run MUST run
  // this check before Sharp composites an SVG. Missing glyphs fail closed.
  if (!force && process.env.NODE_ENV !== "production") return;
  const fallbacks = [
    installedCharset("Arial"),
    installedCharset("sans:lang=ja"),
    installedCharset("sans:lang=zh-cn"),
  ];
  for (const char of label) {
    if (/\s/u.test(char)) continue;
    const codePoint = char.codePointAt(0)!;
    if (!fallbacks.some((ranges) => ranges.some(([min, max]) => codePoint >= min && codePoint <= max)))
      throw new Error(`missing_font_glyph_U+${codePoint.toString(16).toUpperCase()}`);
  }
}
