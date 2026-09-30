import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { buttonVariants } from "@/components/ui/button";
import type { TemplateCard } from "@/lib/db/templates";
import { cn } from "@/lib/utils";

export async function LandingHero({ count, showcase }: { count: number; showcase: TemplateCard[] }) {
  const t = await getTranslations("landing.hero");
  const columns = [0, 1, 2].map((c) => showcase.filter((_, i) => i % 3 === c));
  return (
    <section className="grid items-center gap-10 lg:grid-cols-[1.05fr_1fr]">
      <div className="flex flex-col gap-5">
        <span className="self-start rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs text-primary">{t("eyebrow")}</span>
        <h1 className="text-4xl leading-tight font-semibold tracking-tight whitespace-pre-line sm:text-5xl">{t("title")}</h1>
        <p className="max-w-lg text-base leading-relaxed text-muted-foreground">{t("subtitle", { count })}</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/register" className={cn(buttonVariants({ size: "lg" }), "h-11 px-6 text-base")}>{t("primary")}</Link>
          <Link href="/plans" className={cn(buttonVariants({ size: "lg", variant: "outline" }), "h-11 px-6 text-base")}>{t("secondary")}</Link>
        </div>
        <p className="text-xs text-muted-foreground">{t("note")}</p>
      </div>
      <div className="relative h-[420px] overflow-hidden rounded-2xl sm:h-[500px]" aria-hidden>
        <div className="grid h-full grid-cols-3 gap-3">
          {columns.map((col, ci) => (
            <div key={ci} className={cn("flex flex-col gap-3", ci === 1 && "-mt-16")}>
              {col.map((tpl) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={tpl.id} src={tpl.thumbnails[0]} alt="" loading="eager" className="w-full rounded-xl border object-cover" style={{ aspectRatio: `${tpl.width} / ${tpl.height}` }} />
              ))}
            </div>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />
      </div>
    </section>
  );
}
