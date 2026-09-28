"use client";

import type { TemplateCard } from "@/lib/db/templates";
import { CARD_CAPTION, CARD_PADDING, GalleryCard } from "./gallery-card";
import { MasonryGrid } from "./masonry-grid";

export function SimilarTemplates({ items }: { items: TemplateCard[] }) {
  return (
    <MasonryGrid items={items} cardPadding={CARD_PADDING} captionHeight={CARD_CAPTION} render={(t) => <GalleryCard key={t.id} t={t} eager={false} />} />
  );
}
