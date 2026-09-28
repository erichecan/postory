"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { loadTemplatesAction } from "@/lib/actions/templates";
import type { TemplateCard } from "@/lib/db/templates";
import { CARD_CAPTION, CARD_PADDING, CARD_TITLE, GalleryCard } from "./gallery-card";
import { MasonryGrid } from "./masonry-grid";

export function TemplateGallery({ initial, hasMore: initialHasMore, platform, q }: { initial: TemplateCard[]; hasMore: boolean; platform?: string; q?: string }) {
  const [items, setItems] = useState(initial);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [page, setPage] = useState(1);
  const [pending, start] = useTransition();
  const [error, setError] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

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

  return (
    <div>
      <MasonryGrid
        items={items}
        cardPadding={CARD_PADDING}
        captionHeight={CARD_CAPTION}
        caption={CARD_TITLE}
        render={(t, i) => <GalleryCard key={t.id} t={t} eager={i < 8} />}
      />
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
