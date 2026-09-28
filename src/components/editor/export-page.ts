import { toPng } from "html-to-image";
import fontSheets from "@/data/font-stylesheets.json";
import { plainText, richFontFamilies } from "@/components/canvas/rich-text";
import type { DesignPage } from "@/types/design";

const SPECS: Record<string, string> = fontSheets.specs;
const CJK_FALLBACK = "Noto Sans SC";

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function charsByFamily(page: DesignPage) {
  const map = new Map<string, Set<string>>();
  const add = (family: string, text: string) => {
    const set = map.get(family) ?? new Set<string>();
    for (const ch of text + text.toUpperCase() + text.toLowerCase()) set.add(ch);
    map.set(family, set);
  };
  for (const el of page.elements) {
    if (el.type !== "text" || el.hidden || !el.content) continue;
    const text = plainText(el.content);
    for (const family of [el.style.fontFamily, ...richFontFamilies(el.content)]) if (family) add(family, text);
    add(CJK_FALLBACK, text);
  }
  return map;
}

async function familyCss(family: string, chars: Set<string>) {
  const spec = SPECS[family];
  if (spec === undefined) return "";
  const fam = encodeURIComponent(family).replace(/%20/g, "+");
  const text = encodeURIComponent([...chars].join(""));
  const url = `https://fonts.googleapis.com/css2?family=${fam}${spec ? `:${spec}` : ""}&text=${text}`;
  const css = await (await fetch(url)).text();
  const urls = [...new Set([...css.matchAll(/url\((https:[^)]+)\)/g)].map((m) => m[1]))];
  const inlined = await Promise.all(urls.map(async (u) => [u, await blobToDataUrl(await (await fetch(u)).blob())] as const));
  return inlined.reduce((acc, [u, data]) => acc.split(u).join(data), css);
}

async function buildFontEmbedCss(page: DesignPage) {
  const parts = await Promise.all([...charsByFamily(page)].map(([family, chars]) => familyCss(family, chars).catch(() => "")));
  return parts.join("\n");
}

export async function renderPagePng(node: HTMLElement, page: DesignPage) {
  await document.fonts.ready;
  const fontEmbedCSS = await buildFontEmbedCss(page);
  return toPng(node, { pixelRatio: 1, cacheBust: true, fontEmbedCSS });
}

export async function exportNodeAsPng(node: HTMLElement, page: DesignPage, filename: string) {
  const dataUrl = await renderPagePng(node, page);
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}
