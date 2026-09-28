import { Fragment, type CSSProperties, type ReactNode } from "react";

const TAGS = new Set(["span", "p", "s", "b", "strong", "i", "em", "u", "br"]);
const STYLE_PROPS: Record<string, keyof CSSProperties> = {
  color: "color",
  "font-weight": "fontWeight",
  "font-family": "fontFamily",
  "font-size": "fontSize",
  "font-style": "fontStyle",
  "letter-spacing": "letterSpacing",
  "text-decoration": "textDecoration",
  "text-transform": "textTransform",
  "vertical-align": "verticalAlign",
};
const TAG_STYLE: Record<string, CSSProperties> = {
  b: { fontWeight: 700 },
  strong: { fontWeight: 700 },
  i: { fontStyle: "italic" },
  em: { fontStyle: "italic" },
  u: { textDecoration: "underline" },
  s: { textDecoration: "line-through" },
};

type Node = string | { tag: string; style: CSSProperties; children: Node[] };

const TOKEN = /<\s*(\/?)\s*([a-zA-Z]+)([^>]*)>/g;
const ENTITIES: Record<string, string> = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&nbsp;": " " };

function decode(text: string) {
  return text.replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (m) => ENTITIES[m] ?? m);
}

function parseStyle(attrs: string): CSSProperties {
  const raw = attrs.match(/style\s*=\s*"([^"]*)"/i)?.[1] ?? attrs.match(/style\s*=\s*'([^']*)'/i)?.[1] ?? "";
  const style: Record<string, string> = {};
  for (const decl of raw.split(";")) {
    const i = decl.indexOf(":");
    if (i < 0) continue;
    const prop = STYLE_PROPS[decl.slice(0, i).trim().toLowerCase()];
    const value = decl.slice(i + 1).trim();
    if (!prop || !value || /url\(|expression|javascript:|[<>{}]/i.test(value)) continue;
    style[prop] = value;
  }
  return style as CSSProperties;
}

export function hasRichText(content: string | undefined) {
  return !!content && /<\s*\/?\s*(span|p|s|b|strong|i|em|u|br)\b/i.test(content);
}

export function parseRichText(content: string): Node[] {
  const root: Node[] = [];
  const stack: { tag: string; children: Node[] }[] = [{ tag: "#root", children: root }];
  let last = 0;
  for (const m of content.matchAll(TOKEN)) {
    const [whole, closing, rawTag, attrs] = m;
    const tag = rawTag.toLowerCase();
    if (m.index > last) stack.at(-1)!.children.push(decode(content.slice(last, m.index)));
    last = m.index + whole.length;
    if (!TAGS.has(tag)) continue;
    if (tag === "br") {
      stack.at(-1)!.children.push("\n");
    } else if (closing) {
      const idx = stack.findLastIndex((s) => s.tag === tag);
      if (idx > 0) stack.length = idx;
    } else {
      const node = { tag, style: { ...TAG_STYLE[tag], ...parseStyle(attrs) }, children: [] as Node[] };
      stack.at(-1)!.children.push(node);
      stack.push(node);
    }
  }
  if (last < content.length) stack.at(-1)!.children.push(decode(content.slice(last)));
  return root;
}

export function plainText(content: string | undefined) {
  if (!content) return "";
  if (!hasRichText(content)) return content;
  const walk = (nodes: Node[]): string =>
    nodes.map((n) => (typeof n === "string" ? n : (n.tag === "p" ? "\n" : "") + walk(n.children))).join("");
  return walk(parseRichText(content)).replace(/^\n/, "");
}

export function richFontFamilies(content: string | undefined): string[] {
  if (!content || !hasRichText(content)) return [];
  const out: string[] = [];
  const walk = (nodes: Node[]) =>
    nodes.forEach((n) => {
      if (typeof n === "string") return;
      if (typeof n.style.fontFamily === "string") out.push(n.style.fontFamily.split(",")[0].replace(/["']/g, "").trim());
      walk(n.children);
    });
  walk(parseRichText(content));
  return out;
}

function render(nodes: Node[]): ReactNode {
  return nodes.map((n, i) => {
    if (typeof n === "string") return <Fragment key={i}>{n}</Fragment>;
    return n.tag === "p" ? (
      <span key={i} style={{ ...n.style, display: "block" }}>{render(n.children)}</span>
    ) : (
      <span key={i} style={n.style}>{render(n.children)}</span>
    );
  });
}

export function RichText({ content }: { content: string }) {
  return <>{render(parseRichText(content))}</>;
}
