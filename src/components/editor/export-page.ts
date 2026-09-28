import { toPng } from "html-to-image";

export async function exportNodeAsPng(node: HTMLElement, filename: string) {
  await document.fonts.ready;
  const dataUrl = await toPng(node, { pixelRatio: 1, cacheBust: true });
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}
