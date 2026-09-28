"use client";

import { MasonryGrid } from "@/components/gallery/masonry-grid";
import type { DesignListItem } from "@/lib/db/designs";
import { DESIGN_CARD_CAPTION, DESIGN_CARD_PADDING, DesignCard } from "./design-card";

export function DesignsMasonry({ items }: { items: DesignListItem[] }) {
  const sized = items.map((d) => ({ ...d, width: d.cover.width, height: d.cover.height }));
  return (
    <MasonryGrid items={sized} cardPadding={DESIGN_CARD_PADDING} captionHeight={DESIGN_CARD_CAPTION} render={(d) => <DesignCard key={d.id} d={d} />} />
  );
}
