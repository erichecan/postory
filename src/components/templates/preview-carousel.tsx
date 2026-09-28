"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export function PreviewCarousel({ images, width, height, title }: { images: string[]; width: number; height: number; title: string }) {
  const t = useTranslations("templates.carousel");
  const [i, setI] = useState(0);
  const many = images.length > 1;
  const go = (d: number) => setI((v) => (v + d + images.length) % images.length);
  return (
    <div className="rounded-2xl border bg-white/[0.03] p-3">
      <div className="group relative mx-auto max-h-[640px] overflow-hidden rounded-lg" style={{ aspectRatio: `${width} / ${height}` }}>
        <Image src={images[i]} alt={t("pageAlt", { title, page: i + 1 })} fill sizes="(max-width: 1024px) 100vw, 45vw" className="object-contain" priority />
        {many && (
          <>
            <span className="absolute left-3 top-3 rounded-md bg-black/70 px-1.5 py-0.5 text-[11px] text-white">
              {i + 1} / {images.length}
            </span>
            <button onClick={() => go(-1)} aria-label={t("prev")} className="absolute left-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100">
              <ChevronLeft className="size-4" />
            </button>
            <button onClick={() => go(1)} aria-label={t("next")} className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100">
              <ChevronRight className="size-4" />
            </button>
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1 rounded-full bg-black/60 px-2 py-1">
              {images.map((src, k) => (
                <button key={src} onClick={() => setI(k)} aria-label={t("goTo", { page: k + 1 })} className={cn("h-1.5 rounded-full bg-white/50 transition-all", k === i ? "w-4 bg-white" : "w-1.5")} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
