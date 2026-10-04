"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useState, useTransition } from "react";
import { Layers, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { startDesignAction } from "@/lib/actions/designs";
import { platformLabel } from "@/lib/platforms";
import type { TemplateCard } from "@/lib/db/templates";
import { cn } from "@/lib/utils";
import type { WrappingCaption } from "./masonry-grid";

export const CARD_PADDING = 8;
export const CARD_CAPTION = 104;
export const CARD_TITLE: WrappingCaption<TemplateCard> = { text: (t) => t.title, font: "15px", lineHeight: 20, maxLines: 3, inset: 2 };

export function GalleryCard({ t, eager }: { t: TemplateCard; eager: boolean }) {
  const tg = useTranslations("gallery");
  const tp = useTranslations("platforms");
  const [loaded, setLoaded] = useState(false);
  const [pending, start] = useTransition();
  const imgRef = useCallback((img: HTMLImageElement | null) => {
    if (img?.complete && img.naturalWidth > 0) setLoaded(true);
  }, []);
  return (
    <div className="group flex min-w-0 flex-col">
      <Link
        href={`/templates/${t.id}`}
        className="relative block rounded-xl bg-muted p-2 transition-colors duration-200 hover:bg-accent"
      >
        <div className={cn("relative w-full overflow-hidden rounded-[3px]", !loaded && "animate-pulse bg-muted")} style={{ aspectRatio: `${t.width} / ${t.height}` }}>
          <Image
            src={t.thumbnails[0]}
            alt={t.title}
            fill
            sizes="(max-width: 560px) 50vw, (max-width: 900px) 33vw, 260px"
            priority={eager}
            ref={imgRef}
            onLoad={() => setLoaded(true)}
            className={cn("object-cover shadow-[0_1px_2px_rgba(0,0,0,0.25)] transition-opacity duration-300", loaded ? "opacity-100" : "opacity-0")}
          />
        </div>
        {t.thumbnails.length > 1 && (
          <span className="absolute right-3.5 top-3.5 flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[11px] text-white">
            <Layers className="size-3" />
            {t.thumbnails.length}
          </span>
        )}
      </Link>
      <div className="flex flex-col gap-2 px-0.5 pt-3">
        <Link href={`/templates/${t.id}`} className="line-clamp-3 text-[15px] leading-5 hover:underline">{t.title}</Link>
        <div className="flex items-center gap-1.5">
          <span className="rounded-md border border-border px-1.5 py-0.5 text-[11px] leading-none text-muted-foreground">{platformLabel(tp, t.platform)}</span>
          {t.editable && <span className="rounded-md border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[11px] leading-none text-primary">{tg("fullyEditable")}</span>}
        </div>
        <div>
          <button
            type="button"
            disabled={pending}
            onClick={() => start(() => startDesignAction(t.id))}
            className="inline-flex h-7 items-center gap-1.5 rounded-md border border-border bg-muted px-3 text-sm text-foreground/90 transition-colors hover:bg-accent disabled:opacity-60"
          >
            {pending && <Loader2 className="size-3.5 animate-spin" />}
            {tg("openInEditor")}
          </button>
        </div>
      </div>
    </div>
  );
}
