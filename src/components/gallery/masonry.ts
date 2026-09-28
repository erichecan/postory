export type Sized = { width: number; height: number };

export function columnCountFor(containerWidth: number) {
  if (containerWidth < 560) return 2;
  if (containerWidth < 900) return 3;
  return 4;
}

export function distribute<T extends Sized>(items: T[], columns: number, columnWidth: number, extraHeight: number): T[][] {
  const cols: T[][] = Array.from({ length: columns }, () => []);
  const heights = new Array<number>(columns).fill(0);
  for (const item of items) {
    let target = 0;
    for (let i = 1; i < columns; i++) if (heights[i] < heights[target] - 0.5) target = i;
    cols[target].push(item);
    heights[target] += (columnWidth * item.height) / item.width + extraHeight;
  }
  return cols;
}
