import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function GalleryHero({ title, subtitle, showBack }: { title: string; subtitle: string; showBack: boolean }) {
  const t = await getTranslations("gallery");
  return (
    <section className="flex flex-col items-center px-4 pb-20 pt-16 text-center sm:pb-28 sm:pt-24">
      {showBack && (
        <Link href="/templates" className="mb-6 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" /> {t("allTemplates")}
        </Link>
      )}
      <h1 className="text-balance text-[40px] font-semibold leading-[1.05] tracking-[-0.035em] sm:text-[64px]">{title}</h1>
      <p className="mt-5 max-w-xl text-balance text-base text-muted-foreground sm:text-lg">{subtitle}</p>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <a href="#gallery" className="inline-flex h-11 items-center gap-2 rounded-lg bg-white px-7 text-sm font-medium text-black transition hover:bg-white/90">
          {t("pickTemplate")} <ArrowRight className="size-4" />
        </a>
        <Link href="/designs" className="inline-flex h-11 items-center rounded-lg border border-white/10 bg-white/[0.02] px-7 text-sm transition hover:bg-white/[0.06]">
          {t("viewDesigns")}
        </Link>
      </div>
    </section>
  );
}
