import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarClock, Download, Palette, Store, Type } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { PreviewCarousel } from "@/components/templates/preview-carousel";
import { StartDesignButton } from "@/components/templates/start-design-button";
import { SimilarTemplates } from "@/components/gallery/similar-templates";
import { getTemplate, listSimilarTemplates } from "@/lib/db/templates";
import { platformLabel } from "@/lib/platforms";

export default async function TemplateDetailPage({ params }: PageProps<"/templates/[id]">) {
  const { id } = await params;
  const t = await getTemplate(id);
  if (!t) notFound();
  const [similar, tt, tp] = await Promise.all([listSimilarTemplates(t.id, t.platform, 8), getTranslations("templates"), getTranslations("platforms")]);
  const platform = platformLabel(tp, t.platform);

  const features = [
    { icon: Type, text: tt(t.editable ? "features.editable" : "features.addContent") },
    { icon: Store, text: tt("features.fillBrand") },
    { icon: Palette, text: tt("features.size", { pages: t.pages.length, width: String(t.width), height: String(t.height) }) },
    { icon: Download, text: tt("features.export") },
    { icon: CalendarClock, text: tt("features.schedule") },
  ];

  return (
    <div className="mx-auto max-w-[1080px] px-4 py-10">
      <Link href="/templates" className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" /> {tt("allTemplates")}
      </Link>

      <section className="mt-8 grid items-start gap-10 lg:grid-cols-[1fr_minmax(0,460px)] lg:gap-16">
        <div className="flex flex-col gap-6">
          <span className="w-fit rounded-full border px-2.5 py-1 text-xs text-muted-foreground">{platform}</span>
          <h1 className="text-balance text-3xl font-semibold leading-tight tracking-tight sm:text-[44px]">{t.title}</h1>
          <p className="max-w-lg text-base leading-relaxed text-muted-foreground">
            {t.description ?? tt("fallbackDescription", { platform })}
          </p>
          <div>
            <StartDesignButton templateId={t.id} />
          </div>
          <ul className="mt-4 flex flex-col gap-3.5">
            {features.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-muted-foreground">
                <Icon className="size-4 shrink-0 opacity-70" />
                {text}
              </li>
            ))}
          </ul>
        </div>
        <PreviewCarousel images={t.thumbnails} width={t.width} height={t.height} title={t.title} />
      </section>

      {similar.length > 0 && (
        <section className="mt-20">
          <div className="mb-5 flex items-end justify-between">
            <h2 className="text-lg font-semibold">{tt("moreTemplates", { platform })}</h2>
            <Link href={`/templates?platform=${t.platform}`} className="text-sm text-muted-foreground hover:text-foreground">{tt("viewAll")}</Link>
          </div>
          <SimilarTemplates items={similar} />
        </section>
      )}
    </div>
  );
}
