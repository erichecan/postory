import { CalendarClock, Languages, LayoutTemplate, Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { BeforeAfter } from "./before-after";

const FEATURES = [
  { key: "templates", Icon: LayoutTemplate },
  { key: "ai", Icon: Sparkles },
  { key: "platforms", Icon: CalendarClock },
  { key: "bilingual", Icon: Languages },
] as const;

export async function FeatureGrid({ count }: { count: number }) {
  const t = await getTranslations("landing.features");
  return (
    <section className="flex flex-col gap-6">
      <h2 className="text-center text-2xl font-semibold tracking-tight">{t("title")}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map(({ key, Icon }) => (
          <div key={key} className="flex flex-col gap-3 rounded-xl border bg-card p-5">
            <Icon className="size-6 text-primary" />
            <h3 className="font-semibold">{t(`${key}.title`, { count })}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{t(`${key}.body`)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export async function CompareSection({ sample }: { sample: string }) {
  const t = await getTranslations("landing.compare");
  return (
    <section className="grid items-center gap-8 rounded-2xl border bg-card/50 p-6 sm:p-10 lg:grid-cols-[1fr_1.1fr]">
      <div className="flex flex-col gap-3">
        <h2 className="text-2xl font-semibold tracking-tight">{t("title")}</h2>
        <p className="text-muted-foreground">{t("subtitle")}</p>
        <p className="text-xs text-muted-foreground/70">{t("note")}</p>
      </div>
      <div className="flex justify-center lg:justify-end">
        <BeforeAfter src={sample} before={t("before")} after={t("after")} />
      </div>
    </section>
  );
}

export async function StepsSection() {
  const t = await getTranslations("landing.steps");
  return (
    <section className="flex flex-col gap-6">
      <h2 className="text-center text-2xl font-semibold tracking-tight">{t("title")}</h2>
      <ol className="grid gap-4 md:grid-cols-3">
        {(["s1", "s2", "s3"] as const).map((s, i) => (
          <li key={s} className="flex gap-4 rounded-xl border p-5">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/15 text-sm font-semibold text-primary">{i + 1}</span>
            <div className="flex flex-col gap-1">
              <h3 className="font-semibold">{t(`${s}.title`)}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{t(`${s}.body`)}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
