"use client";

import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { columnCountFor, distribute, type Sized } from "./masonry";

export const MASONRY_GAP = 24;

export function MasonryGrid<T extends Sized & { id: string }>({
  items,
  render,
  cardPadding,
  captionHeight,
  maxColumns = 4,
}: {
  items: T[];
  render: (item: T, index: number) => ReactNode;
  cardPadding: number;
  captionHeight: number;
  maxColumns?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.getBoundingClientRect().width);
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const columns = useMemo(() => {
    const count = Math.min(maxColumns, width ? columnCountFor(width) : maxColumns);
    const colWidth = width ? (width - MASONRY_GAP * (count - 1)) / count : 240;
    return distribute(items, count, colWidth - cardPadding * 2, cardPadding * 2 + captionHeight);
  }, [items, width, maxColumns, cardPadding, captionHeight]);

  const indexOf = useMemo(() => new Map(items.map((t, i) => [t.id, i])), [items]);

  return (
    <div ref={ref} className="flex items-start" style={{ gap: MASONRY_GAP }}>
      {columns.map((col, ci) => (
        <div key={ci} className="flex min-w-0 flex-1 flex-col" style={{ gap: MASONRY_GAP }}>
          {col.map((item) => render(item, indexOf.get(item.id) ?? 0))}
        </div>
      ))}
    </div>
  );
}
