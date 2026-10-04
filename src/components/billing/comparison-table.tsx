import { Check, Minus } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { FEATURE_GROUPS, type FeatureUnit, type FeatureValue, type TierFeatures } from "@/lib/billing/tier-features";
import { cn } from "@/lib/utils";
import { ContactButton } from "./contact-button";

export type ComparisonTier = { id: string; name: string; tagline: string; features: TierFeatures; recommended?: boolean };

export async function ComparisonTable({ tiers }: { tiers: ComparisonTier[] }) {
  const t = await getTranslations("plans");

  function cell(value: FeatureValue, unit?: FeatureUnit) {
    if (value === true) return <Check className="mx-auto size-5 text-primary" aria-label={t("values.yes")} />;
    if (value === false) return <Minus className="mx-auto size-4 text-muted-foreground/50" aria-label={t("values.no")} />;
    if (typeof value === "number") return <span className="font-medium tabular-nums">{t(`values.${unit ?? "images"}`, { count: value })}</span>;
    return <span className="text-foreground/85">{t(`values.${value}`)}</span>;
  }

  const hints: Partial<Record<string, string>> = { basePlatforms: t("hints.basePlatforms"), monthlyCredits: t("hints.monthlyCredits") };

  const unitOf = (f: (typeof FEATURE_GROUPS)[number]["features"][number]) => ("unit" in f ? f.unit : undefined);

  const cards = (
    <div className="flex flex-col gap-4 md:hidden">
      {tiers.map((tier) => (
        <section key={tier.id} className={cn("flex flex-col gap-4 rounded-2xl border bg-card p-5", tier.recommended && "border-primary/60 ring-1 ring-primary/30")}>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">{tier.name}</h3>
              {tier.recommended && <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-primary">{t("recommended")}</span>}
            </div>
            <p className="text-xs text-muted-foreground">{tier.tagline}</p>
          </div>
          {FEATURE_GROUPS.map((group) => (
            <div key={group.id} className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-muted-foreground">{t(`groups.${group.id}`)}</p>
              {group.features.map((f) => (
                <div key={f.id} className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-foreground/85">{t(`features.${f.id}`)}</span>
                  <span className="shrink-0 text-right [&_svg]:mx-0">{cell(tier.features[f.id], unitOf(f))}</span>
                </div>
              ))}
            </div>
          ))}
          <ContactButton label={t("cta")} variant={tier.recommended ? "default" : "outline"} size="lg" className="h-10 w-full" />
        </section>
      ))}
    </div>
  );

  return (
    <>
      {cards}
      <div className="hidden overflow-x-auto rounded-2xl border md:block">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 w-[34%] bg-background p-5 text-left align-bottom text-xs font-medium text-muted-foreground">{t("feature")}</th>
              {tiers.map((tier) => (
                <th key={tier.id} className={cn("p-5 text-center align-top font-normal", tier.recommended && "bg-primary/[0.06]")}>
                  <div className="flex h-full flex-col items-center gap-1.5">
                    {tier.recommended && <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-primary">{t("recommended")}</span>}
                    <span className="text-lg font-semibold">{tier.name}</span>
                    <span className="text-xs text-muted-foreground">{tier.tagline}</span>
                    <ContactButton label={t("cta")} variant={tier.recommended ? "default" : "outline"} className="mt-2 w-full max-w-40" />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          {FEATURE_GROUPS.map((group) => (
            <tbody key={group.id}>
              <tr className="border-t">
                <th colSpan={tiers.length + 1} className="sticky left-0 bg-muted/40 px-5 py-2.5 text-left text-xs font-semibold tracking-wide">{t(`groups.${group.id}`)}</th>
              </tr>
              {group.features.map((f) => (
                <tr key={f.id} className="border-t border-border">
                  <th scope="row" className="sticky left-0 z-10 bg-background px-5 py-3.5 text-left font-normal">
                    <span className="text-foreground/90">{t(`features.${f.id}`)}</span>
                    {hints[f.id] && <span className="mt-0.5 block text-xs text-muted-foreground">{hints[f.id]}</span>}
                  </th>
                  {tiers.map((tier) => (
                    <td key={tier.id} className={cn("px-4 py-3.5 text-center", tier.recommended && "bg-primary/[0.06]")}>
                      {cell(tier.features[f.id], unitOf(f))}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>
    </>
  );
}
