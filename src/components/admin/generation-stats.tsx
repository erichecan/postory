import { getFormatter, getTranslations } from "next-intl/server";
import type { DailyGenerationStats } from "@/lib/db/admin-generations";

export const usd = (micros: number) => `$${(micros / 1_000_000).toFixed(micros > 0 && micros < 10_000_000 ? 3 : 2)}`;

function Tile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border bg-card p-4">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-2xl font-semibold tabular-nums">{value}</span>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  );
}

export async function GenerationStats({ days, capMicros }: { days: DailyGenerationStats[]; capMicros: number }) {
  const [t, format] = await Promise.all([getTranslations("admin.generations"), getFormatter()]);
  const sum = (k: keyof Omit<DailyGenerationStats, "day">) => days.reduce((s, d) => s + d[k], 0);
  const todayKey = new Date().toISOString().slice(0, 10);
  const today = days.find((d) => d.day.toISOString().slice(0, 10) === todayKey);
  const cost = sum("costMicros");
  const credits = sum("credits");
  const total = sum("total");

  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Tile label={t("tiles.today")} value={usd(today?.costMicros ?? 0)} hint={t("tiles.cap", { cap: (capMicros / 1_000_000).toFixed(0) })} />
        <Tile label={t("tiles.cost30")} value={usd(cost)} />
        <Tile label={t("tiles.credits30")} value={String(credits)} />
        <Tile label={t("tiles.perCredit")} value={credits ? usd(Math.round(cost / credits)) : "—"} hint={t("tiles.perCreditHint")} />
        <Tile label={t("tiles.failRate")} value={total ? `${Math.round((sum("failed") / total) * 100)}%` : "—"} hint={t("tiles.failRateHint")} />
      </div>
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{t("daily.title")}</h2>
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-muted/40 text-xs text-muted-foreground">
              <tr>
                {(["day", "total", "succeeded", "failed", "credits", "cost"] as const).map((k, i) => (
                  <th key={k} className={i === 0 ? "px-4 py-2.5 text-left font-medium" : "px-4 py-2.5 text-right font-medium"}>{t(`daily.${k}`)}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {days.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">{t("daily.empty")}</td></tr>
              )}
              {days.map((d) => (
                <tr key={d.day.toISOString()} className="tabular-nums">
                  <td className="px-4 py-2.5">{format.dateTime(d.day, { month: "short", day: "numeric", timeZone: "UTC" })}</td>
                  <td className="px-4 py-2.5 text-right">{d.total}</td>
                  <td className="px-4 py-2.5 text-right">{d.succeeded}</td>
                  <td className="px-4 py-2.5 text-right">{d.failed}</td>
                  <td className="px-4 py-2.5 text-right">{d.credits}</td>
                  <td className="px-4 py-2.5 text-right">{usd(d.costMicros)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
