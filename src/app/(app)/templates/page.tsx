import { getTranslations } from "next-intl/server";
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

  const [first, counts, t, tp] = await Promise.all([
    listTemplates({ platform, q, page: 1 }),
    countTemplatesByPlatform(),
    getTranslations("gallery"),
    getTranslations("platforms"),
  ]);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="mx-auto max-w-[1080px] px-4">
      <GalleryHero
        title={platform ? t("platformTitle", { platform: platformLabel(tp, platform) }) : t("title")}
        subtitle={t("subtitle")}
        showBack={!!platform || !!q}
      />
      <section id="gallery" className="scroll-mt-28 md:scroll-mt-20">
        <CategoryBar platform={platform} q={q} counts={counts} total={total} />
        {first.items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 py-20 text-center text-muted-foreground">{t("empty")}</div>
        ) : (
          <TemplateGallery key={`${platform ?? ""}|${q ?? ""}`} initial={first.items} hasMore={first.pageCount > 1} platform={platform} q={q} />
        )}
      </section>
    </div>
  );
}
