import "server-only";
import { RATIOS } from "@/components/create/studio-options";
import { ProviderError, type GenerateInput, type GenerateOutput, type ImageProvider } from "./types";

export const FAKE_FAIL_MARKER = "[fail]";
export const FAKE_REJECT_MARKER = "[reject]";

const PALETTES = [
  ["#f97316", "#7c2d12"],
  ["#14b8a6", "#134e4a"],
  ["#e11d48", "#4c0519"],
  ["#8b5cf6", "#2e1065"],
  ["#eab308", "#422006"],
];

const escapeXml = (s: string) => s.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`);

function hash(s: string) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0;
  return Math.abs(h);
}

function wrap(text: string, perLine: number, maxLines: number) {
  const lines: string[] = [];
  for (let i = 0; i < text.length && lines.length < maxLines; i += perLine) lines.push(text.slice(i, i + perLine));
  return lines;
}

function render({ prompt, ratio, quality, input }: GenerateInput) {
  const shape = RATIOS.find((r) => r.id === ratio) ?? RATIOS[0];
  const w = 1024;
  const h = Math.round((w * shape.h) / shape.w);
  const [from, to] = PALETTES[hash(prompt) % PALETTES.length];
  const photo = input ? `<image href="data:${input.mime};base64,${input.bytes.toString("base64")}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice"/><rect width="${w}" height="${h}" fill="url(#g)" opacity="0.35"/>` : `<rect width="${w}" height="${h}" fill="url(#g)"/>`;
  const lines = wrap(prompt, 38, 6)
    .map((l, i) => `<text x="56" y="${h - 260 + i * 34}" font-size="24" fill="#fff" opacity="0.85">${escapeXml(l)}</text>`)
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" font-family="system-ui, sans-serif">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>
${photo}
<rect x="32" y="32" width="236" height="48" rx="24" fill="#000" opacity="0.55"/>
<text x="56" y="64" font-size="22" font-weight="600" fill="#fff">AI PLACEHOLDER · ${quality === "hd" ? "HD" : "STD"}</text>
<rect x="32" y="${h - 300}" width="${w - 64}" height="268" rx="20" fill="#000" opacity="0.45"/>
${lines}
</svg>`;
}

export const fakeProvider: ImageProvider = {
  name: "fake",
  async generate(input: GenerateInput): Promise<GenerateOutput> {
    await new Promise((r) => setTimeout(r, Number(process.env.FAKE_AI_DELAY_MS ?? "1200")));
    if (input.prompt.includes(FAKE_REJECT_MARKER)) throw new ProviderError("rejected", "content policy (fake)");
    if (input.prompt.includes(FAKE_FAIL_MARKER)) throw new ProviderError("failed", "upstream error (fake)");
    return { bytes: Buffer.from(render(input)), mime: "image/svg+xml", costMicros: 0 };
  },
};
