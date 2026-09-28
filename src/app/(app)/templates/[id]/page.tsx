import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarClock, Download, Palette, Store, Type } from "lucide-react";
import { PreviewCarousel } from "@/components/templates/preview-carousel";
import { StartDesignButton } from "@/components/templates/start-design-button";
import { TemplateCard } from "@/components/templates/template-card";
import { getTemplate, listSimilarTemplates } from "@/lib/db/templates";
import { platformLabel } from "@/lib/platforms";

export default async function TemplateDetailPage({ params }: PageProps<"/templates/[id]">) {
  const { id } = await params;
  const t = await getTemplate(id);
  if (!t) notFound();
  const similar = await listSimilarTemplates(t.id, t.platform);

  const features = [
    t.editable
      ? { icon: Type, text: "模板上的文字、颜色、图片全部可以直接改" }
      : { icon: Type, text: "在模板上添加文字、Logo 和图片" },
    { icon: Store, text: "一键填入你的店名、微信、活动文案" },
    { icon: Palette, text: `${t.pages.length > 1 ? `${t.pages.length} 个尺寸页面，` : ""}${t.width} × ${t.height} 像素` },
    { icon: Download, text: "导出高清 PNG，直接发朋友圈、小红书" },
    { icon: CalendarClock, text: "设定发布平台和时间，统一排期管理" },
  ];

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-8">
      <Link href="/templates" className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" /> 全部模板
      </Link>

      <section className="mt-8 grid items-start gap-10 lg:grid-cols-[1fr_minmax(0,460px)] lg:gap-16">
        <div className="flex flex-col gap-6">
          <span className="w-fit rounded-full border px-2.5 py-1 text-xs text-muted-foreground">{platformLabel(t.platform)}</span>
          <h1 className="text-balance text-3xl font-semibold leading-tight tracking-tight sm:text-[44px]">{t.title}</h1>
          <p className="max-w-lg text-base leading-relaxed text-muted-foreground">
            {t.description ?? `适用于 ${platformLabel(t.platform)} 的宣传模板。选中后替换成你自己的文案和图片，几分钟完成一张可发布的图。`}
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
            <h2 className="text-lg font-semibold">更多 {platformLabel(t.platform)} 模板</h2>
            <Link href={`/templates?platform=${t.platform}`} className="text-sm text-muted-foreground hover:text-foreground">查看全部</Link>
          </div>
          <div className="columns-2 gap-5 sm:columns-3 lg:columns-6">
            {similar.map((s) => (
              <TemplateCard key={s.id} t={s} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
