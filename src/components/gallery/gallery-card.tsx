"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Layers, Loader2 } from "lucide-react";
import { startDesignAction } from "@/lib/actions/designs";
import { platformLabel } from "@/lib/platforms";
import type { TemplateCard } from "@/lib/db/templates";
import { cn } from "@/lib/utils";

export const CARD_PADDING = 8;
export const CARD_CAPTION = 104;

export function GalleryCard({ t, eager }: { t: TemplateCard; eager: boolean }) {
  const [loaded, setLoaded] = useState(false);
  const [pending, start] = useTransition();
  return (
    <div className="group flex min-w-0 flex-col">
      <Link
        href={`/templates/${t.id}`}
        className="relative block rounded-xl bg-white/[0.05] p-2 transition-colors duration-200 hover:bg-white/[0.09]"
      >
        <div className={cn("relative w-full overflow-hidden rounded-[3px]", !loaded && "animate-pulse bg-white/[0.06]")} style={{ aspectRatio: `${t.width} / ${t.height}` }}>
          <Image
            src={t.thumbnails[0]}
            alt={t.title}
            fill
            sizes="(max-width: 560px) 50vw, (max-width: 900px) 33vw, 260px"
            priority={eager}
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
        <Link href={`/templates/${t.id}`} className="truncate text-[15px] leading-tight hover:underline">{t.title}</Link>
        <div className="flex items-center gap-1.5">
          <span className="rounded-md border border-white/10 px-1.5 py-0.5 text-[11px] leading-none text-muted-foreground">{platformLabel(t.platform)}</span>
          {t.editable && <span className="rounded-md border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[11px] leading-none text-primary">全部可改</span>}
        </div>
        <div>
          <button
            type="button"
            disabled={pending}
            onClick={() => start(() => startDesignAction(t.id))}
            className="inline-flex h-7 items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.03] px-3 text-sm text-foreground/90 transition-colors hover:bg-white/[0.08] disabled:opacity-60"
          >
            {pending && <Loader2 className="size-3.5 animate-spin" />}
            在编辑器中打开
          </button>
        </div>
      </div>
    </div>
  );
}
