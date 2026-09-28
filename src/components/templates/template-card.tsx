import Image from "next/image";
import Link from "next/link";
import { Layers } from "lucide-react";
import { platformLabel } from "@/lib/platforms";
import type { TemplateCard as TemplateCardData } from "@/lib/db/templates";

export function TemplateCard({ t, priority = false }: { t: TemplateCardData; priority?: boolean }) {
  return (
    <Link href={`/templates/${t.id}`} className="group mb-5 block break-inside-avoid">
      <div className="relative overflow-hidden rounded-xl bg-white/[0.04] p-2 transition-colors group-hover:bg-white/[0.08]">
        <div className="relative w-full overflow-hidden rounded-md" style={{ aspectRatio: `${t.width} / ${t.height}` }}>
          <Image
            src={t.thumbnails[0]}
            alt={t.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 20vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            priority={priority}
          />
        </div>
        {t.thumbnails.length > 1 && (
          <span className="absolute right-3.5 top-3.5 flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[11px] text-white">
            <Layers className="size-3" />
            {t.thumbnails.length} 页
          </span>
        )}
      </div>
      <div className="mt-2 px-1">
        <p className="line-clamp-2 text-[13px] font-medium leading-snug">{t.title}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {platformLabel(t.platform)}
          {t.editable && <span className="ml-2 text-primary">· 全部可改</span>}
        </p>
      </div>
    </Link>
  );
}
