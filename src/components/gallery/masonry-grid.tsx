"use client";

import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { columnCountFor, countLines, distribute, type Sized } from "./masonry";

export const MASONRY_GAP = 24;

export type WrappingCaption<T> = {
  text: (item: T) => string;
  font: string;
  lineHeight: number;
  maxLines: number;
  inset: number;
};

export function MasonryGrid<T extends Sized & { id: string }>({
  items,
  render,
  cardPadding,
  captionHeight,
  caption,
  maxColumns = 4,
}: {
  items: T[];
  render: (item: T, index: number) => ReactNode;
  cardPadding: number;
  captionHeight: number;
  caption?: WrappingCaption<T>;
  maxColumns?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [font, setFont] = useState<{ family: string } | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.getBoundingClientRect().width);
    const readFont = () => setFont({ family: getComputedStyle(el).fontFamily });
    readFont();
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    let alive = true;
    document.fonts?.ready.then(() => alive && readFont());
    return () => {
      alive = false;
      ro.disconnect();
    };
  }, []);

  const columns = useMemo(() => {
    const count = Math.min(maxColumns, width ? columnCountFor(width) : maxColumns);
    const colWidth = width ? (width - MASONRY_GAP * (count - 1)) / count : 240;
    const ctx = caption && font ? document.createElement("canvas").getContext("2d") : null;
    let extra: number | ((item: T) => number) = cardPadding * 2 + captionHeight;
    if (caption && ctx && font) {
      ctx.font = `${caption.font} ${font.family}`;
      const measure = (s: string) => ctx.measureText(s).width;
      const textWidth = colWidth - caption.inset * 2;
      extra = (item) => cardPadding * 2 + captionHeight + (countLines(caption.text(item), textWidth, measure, caption.maxLines) - 1) * caption.lineHeight;
    }
    return distribute(items, count, colWidth - cardPadding * 2, extra);
  }, [items, width, maxColumns, cardPadding, captionHeight, caption, font]);

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
