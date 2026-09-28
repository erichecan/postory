"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { loadTemplatesAction } from "@/lib/actions/templates";
import type { TemplateCard } from "@/lib/db/templates";
import { CARD_CAPTION, CARD_PADDING, GalleryCard } from "./gallery-card";
import { columnCountFor, distribute } from "./masonry";

const GAP = 24;

export function TemplateGallery({ initial, hasMore: initialHasMore, platform, q }: { initial: TemplateCard[]; hasMore: boolean; platform?: string; q?: string }) {
  const [items, setItems] = useState(initial);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [page, setPage] = useState(1);
  const [width, setWidth] = useState(0);
  const [pending, start] = useTransition();
  const [error, setError] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const loadMore = useCallback(() => {
    if (pending || !hasMore) return;
    start(async () => {
      try {
        const next = await loadTemplatesAction({ platform, q, page: page + 1 });
        setItems((prev) => [...prev, ...next.items.filter((n) => !prev.some((p) => p.id === n.id))]);
        setHasMore(next.hasMore);
        setPage((p) => p + 1);
        setError(false);
      } catch {
        setError(true);
      }
    });
  }, [pending, hasMore, platform, q, page]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || error) return;
    const io = new IntersectionObserver(([entry]) => entry.isIntersecting && loadMore(), { rootMargin: "900px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore, hasMore, error]);

  const columns = useMemo(() => {
    const count = width ? columnCountFor(width) : 4;
    const colWidth = width ? (width - GAP * (count - 1)) / count : 240;
    return distribute(items, count, colWidth - CARD_PADDING * 2, CARD_PADDING * 2 + CARD_CAPTION);
  }, [items, width]);

  return (
    <div ref={wrapRef}>
      <div className="flex items-start" style={{ gap: GAP }}>
        {columns.map((col, ci) => (
          <div key={ci} className="flex min-w-0 flex-1 flex-col" style={{ gap: GAP }}>
            {col.map((t) => (
              <GalleryCard key={t.id} t={t} eager={items.indexOf(t) < 8} />
            ))}
          </div>
        ))}
      </div>
      <div ref={sentinelRef} className="flex justify-center py-12">
        {pending && <Loader2 className="size-5 animate-spin text-muted-foreground" />}
        {!pending && hasMore && (
          <button onClick={loadMore} className="rounded-lg border border-white/10 px-4 py-2 text-sm text-muted-foreground hover:text-foreground">
            {error ? "加载失败，点击重试" : "加载更多"}
          </button>
        )}
        {!hasMore && items.length > 0 && <p className="text-sm text-muted-foreground">已经到底了 · 共 {items.length} 个模板</p>}
      </div>
    </div>
  );
}
