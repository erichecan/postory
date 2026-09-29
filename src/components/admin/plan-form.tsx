"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminActivateOfflineAction, adminCancelPlanAction, adminSavePlanAction } from "@/lib/actions/admin-billing";
import { formatMoney, monthlyTotal } from "@/lib/billing/plan-math";
import { BASE_PUBLISH_PLATFORMS, EXTRA_PUBLISH_PLATFORMS } from "@/lib/platforms";
import { cn } from "@/lib/utils";
import type { Currency, PlanBilling, PlanStatus, PlanView, TierView } from "@/types/commerce";

const CURRENCIES: Currency[] = ["EUR", "CAD"];

export type PlanDraft = Omit<PlanView, "tierName" | "status" | "currentPeriodEnd" | "billing">;
type Draft = PlanDraft;
type Saved = { status: PlanStatus; billing: PlanBilling; currentPeriodEnd: Date | null } | null;

function MoneyInput({ id, label, cents, currency, onChange }: { id: string; label: string; cents: number; currency: Currency; onChange: (cents: number) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex h-9 items-center rounded-lg border bg-input/30 pl-3 text-sm focus-within:ring-2 focus-within:ring-ring/50">
        <span className="text-muted-foreground">{currency === "EUR" ? "€" : "C$"}</span>
        <input id={id} type="number" min={0} step="0.01" value={cents / 100} onChange={(e) => onChange(Math.max(0, Math.round(Number(e.target.value) * 100)))} className="h-full w-full bg-transparent px-2 tabular-nums outline-none" />
      </div>
    </div>
  );
}

function NumberInput({ id, label, value, onChange }: { id: string; label: string; value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type="number" min={0} value={value} onChange={(e) => onChange(Math.max(0, Math.round(Number(e.target.value))))} className="h-9 tabular-nums" />
    </div>
  );
}

export function PlanForm({ userId, tiers, initial, saved }: { userId: string; tiers: TierView[]; initial: Draft; saved: Saved }) {
  const t = useTranslations("admin.customer");
  const tp = useTranslations("platforms.publish");
  const ts = useTranslations("billing.plan.status");
  const locale = useLocale();
  const format = useFormatter();
  const [pending, start] = useTransition();

  function run(action: () => Promise<{ ok: boolean; error?: string }>, success: string) {
    start(async () => {
      const res = await action();
      if (res.ok) toast.success(success);
      else toast.error(res.error ?? t("invalid"));
    });
  }
  const [d, setD] = useState<Draft>(initial);
  const [months, setMonths] = useState(1);
  const set = (patch: Partial<Draft>) => setD((v) => ({ ...v, ...patch }));
  const allIn = d.allInclusiveFee !== null;
  const total = monthlyTotal(d);

  function pickTier(id: string) {
    const tier = tiers.find((x) => x.id === id);
    if (tier) set({ tierId: id, monthlyCredits: tier.defaultMonthlyCredits, monthlyVideos: tier.defaultMonthlyVideos });
  }

  function toggleExtra(p: string) {
    set({ extraPlatforms: d.extraPlatforms.includes(p) ? d.extraPlatforms.filter((x) => x !== p) : [...d.extraPlatforms, p] });
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
      <section className="flex flex-col gap-5 rounded-xl border bg-card p-5">
        <div>
          <h2 className="font-semibold">{t("planTitle")}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{t("planHint")}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="p-tier">{t("tier")}</Label>
            <select id="p-tier" value={d.tierId} onChange={(e) => pickTier(e.target.value)} className="h-9 rounded-lg border bg-input/30 px-2.5 text-sm [color-scheme:dark]">
              {tiers.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">{t("currency")}</span>
            <div className="grid h-9 grid-cols-2 rounded-lg bg-muted p-[3px]">
              {CURRENCIES.map((c) => (
                <button key={c} type="button" onClick={() => set({ currency: c })} className={cn("rounded-md text-sm", d.currency === c ? "bg-background font-medium dark:bg-input/40" : "text-muted-foreground")}>{c}</button>
              ))}
            </div>
          </div>
        </div>

        <label className="flex items-start gap-2.5 rounded-lg border p-3 text-sm">
          <input type="checkbox" checked={allIn} onChange={(e) => set({ allInclusiveFee: e.target.checked ? total : null })} className="mt-0.5 size-4 accent-[var(--primary)]" />
          <span className="flex flex-col">
            {t("allInclusive")}
            <span className="text-xs text-muted-foreground">{t("allInclusiveHint")}</span>
          </span>
        </label>

        {allIn ? (
          <MoneyInput id="p-all" label={t("allInclusiveFee")} cents={d.allInclusiveFee ?? 0} currency={d.currency} onChange={(v) => set({ allInclusiveFee: v })} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <MoneyInput id="p-base" label={t("baseFee")} cents={d.baseFee} currency={d.currency} onChange={(v) => set({ baseFee: v })} />
            <MoneyInput id="p-extra-fee" label={t("extraPlatformFee")} cents={d.extraPlatformFee} currency={d.currency} onChange={(v) => set({ extraPlatformFee: v })} />
          </div>
        )}

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">{t("basePlatforms")}</span>
          <div className="flex flex-wrap gap-1.5">
            {BASE_PUBLISH_PLATFORMS.map((p) => <span key={p} className="rounded-md border bg-muted/40 px-2 py-1 text-xs text-muted-foreground">{tp(p)}</span>)}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">{t("extraPlatforms")}</span>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {EXTRA_PUBLISH_PLATFORMS.map((p) => {
              const on = d.extraPlatforms.includes(p);
              return (
                <button key={p} type="button" onClick={() => toggleExtra(p)} className={cn("flex h-9 items-center justify-between rounded-lg border px-2.5 text-xs", on && "border-primary bg-primary/10")}>
                  {tp(p)} {on && <Check className="size-3.5 text-primary" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <NumberInput id="p-credits" label={t("monthlyCredits")} value={d.monthlyCredits} onChange={(v) => set({ monthlyCredits: v })} />
          <NumberInput id="p-videos" label={t("monthlyVideos")} value={d.monthlyVideos} onChange={(v) => set({ monthlyVideos: v })} />
          <MoneyInput id="p-topup" label={t("topupUnitPrice")} cents={d.topupUnitPrice} currency={d.currency} onChange={(v) => set({ topupUnitPrice: v })} />
        </div>
      </section>

      <aside className="flex flex-col gap-4 lg:sticky lg:top-20 lg:self-start">
        <div className="flex flex-col gap-3 rounded-xl border bg-card p-5">
          <span className="text-xs text-muted-foreground">{t("summary")}</span>
          <span className="text-3xl font-semibold tabular-nums">{formatMoney(total, d.currency, locale)}</span>
          <span className="text-xs text-muted-foreground">
            {d.monthlyCredits} credit · {d.monthlyVideos} video · {BASE_PUBLISH_PLATFORMS.length + d.extraPlatforms.length} platforms
          </span>
          <Button size="lg" className="mt-1 h-10" disabled={pending} onClick={() => run(() => adminSavePlanAction(userId, d), t("saved"))}>{t("save")}</Button>
          <div className="flex items-center justify-between gap-2 border-t pt-3 text-xs">
            <span className="text-muted-foreground">{t("status")}</span>
            <span className="text-right">
              {saved ? ts(saved.status) : t("noPlan")}
              {saved?.currentPeriodEnd && <span className="block text-muted-foreground">{t("periodEnd", { date: format.dateTime(saved.currentPeriodEnd, { dateStyle: "medium" }) })}</span>}
            </span>
          </div>
          {saved?.billing === "STRIPE" && saved.status === "ACTIVE" && <p className="text-xs text-muted-foreground">{t("activeStripeHint")}</p>}
          {saved && saved.status !== "CANCELED" && (
            <Button
              variant="ghost"
              className="text-destructive hover:bg-destructive/10"
              disabled={pending}
              onClick={() => window.confirm(t("cancelConfirm")) && run(() => adminCancelPlanAction(userId), t("canceled"))}
            >
              {t("cancel")}
            </Button>
          )}
        </div>
        <div className="flex flex-col gap-3 rounded-xl border bg-card p-5">
          <h3 className="text-sm font-semibold">{t("offlineTitle")}</h3>
          <p className="text-xs text-muted-foreground">{t("offlineHint")}</p>
          <div className="flex items-end gap-2">
            <NumberInput id="p-months" label={t("months")} value={months} onChange={(v) => setMonths(Math.min(24, Math.max(1, v)))} />
            <Button variant="outline" size="lg" className="h-9" disabled={pending || !saved} onClick={() => run(() => adminActivateOfflineAction(userId, months), t("offlineDone"))}>{t("offlineSubmit", { count: months })}</Button>
          </div>
          {!saved && <p className="text-xs text-muted-foreground">{t("needSave")}</p>}
        </div>
      </aside>
    </div>
  );
}
