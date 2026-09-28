export type Sized = { width: number; height: number };

export function columnCountFor(containerWidth: number) {
  if (containerWidth < 560) return 2;
  if (containerWidth < 900) return 3;
  return 4;
}

export function distribute<T extends Sized>(
  items: T[],
  columns: number,
  columnWidth: number,
  extraHeight: number | ((item: T) => number),
): T[][] {
  const cols: T[][] = Array.from({ length: columns }, () => []);
  const heights = new Array<number>(columns).fill(0);
  for (const item of items) {
    let target = 0;
    for (let i = 1; i < columns; i++) if (heights[i] < heights[target] - 0.5) target = i;
    cols[target].push(item);
    const extra = typeof extraHeight === "number" ? extraHeight : extraHeight(item);
    heights[target] += (columnWidth * item.height) / item.width + extra;
  }
  return cols;
}

const CJK = /[　-鿿가-힯＀-￯]/;

export function countLines(text: string, maxWidth: number, measure: (s: string) => number, maxLines: number) {
  const tokens = text.split(/(\s+)/).flatMap((t) => (CJK.test(t) ? [...t] : [t])).filter(Boolean);
  let lines = 1;
  let line = "";
  for (const token of tokens) {
    const next = line + token;
    if (line && !/^\s+$/.test(token) && measure(next) > maxWidth) {
      lines++;
      if (lines >= maxLines) return maxLines;
      line = token;
    } else {
      line = next;
    }
  }
  return lines;
}
