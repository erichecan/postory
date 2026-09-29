import { getTranslations } from "next-intl/server";
import { CHARGE_CREDITS } from "@/lib/billing/plan-math";

export async function CostRules() {
  const t = await getTranslations("billing.rules");
  const rows = [
    { label: t("template"), count: CHARGE_CREDITS.TEMPLATE_EXPORT },
    { label: t("aiStandard"), count: CHARGE_CREDITS.AI_STANDARD },
    { label: t("aiHd"), count: CHARGE_CREDITS.AI_HD },
  ];
  return (
    <section className="flex flex-col gap-3 rounded-xl border bg-card p-5">
      <h2 className="font-semibold">{t("title")}</h2>
      <div className="flex flex-col gap-2 text-sm">
        {rows.map((r) => (
          <div key={r.label} className="flex justify-between">
            <span className="text-muted-foreground">{r.label}</span>
            <span className="tabular-nums">{t("credits", { count: r.count })}</span>
          </div>
        ))}
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">{t("note")}</p>
    </section>
  );
}
