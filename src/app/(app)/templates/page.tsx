import { CategoryBar } from "@/components/gallery/category-bar";
import { GalleryHero } from "@/components/gallery/gallery-hero";
import { TemplateGallery } from "@/components/gallery/template-gallery";
import { countTemplatesByPlatform, listTemplates } from "@/lib/db/templates";
import { isPlatformId, platformLabel } from "@/lib/platforms";

function one(v: string | string[] | undefined) {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

export default async function TemplatesPage({ searchParams }: PageProps<"/templates">) {
  const sp = await searchParams;
  const rawPlatform = one(sp.platform);
  const platform = isPlatformId(rawPlatform) ? rawPlatform : undefined;
  const q = one(sp.q)?.slice(0, 64);

  const [first, counts] = await Promise.all([listTemplates({ platform, q, page: 1 }), countTemplatesByPlatform()]);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="mx-auto max-w-[1080px] px-4">
      <GalleryHero
        title={platform ? `${platformLabel(platform)}模板` : "社交媒体模板"}
        subtitle="挑一个模板，换上你的店名、活动和微信。几分钟做出一张能发的图。"
        showBack={!!platform || !!q}
      />
      <section id="gallery" className="scroll-mt-20">
        <CategoryBar platform={platform} q={q} counts={counts} total={total} />
        {first.items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 py-20 text-center text-muted-foreground">没有找到匹配的模板，换个关键词试试。</div>
        ) : (
          <TemplateGallery key={`${platform ?? ""}|${q ?? ""}`} initial={first.items} hasMore={first.pageCount > 1} platform={platform} q={q} />
        )}
      </section>
    </div>
  );
}
