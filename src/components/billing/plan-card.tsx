import Link from "next/link";
import { CreditCard, ExternalLink } from "lucide-react";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { buttonVariants } from "@/components/ui/button";
import { formatMoney, monthlyTotal } from "@/lib/billing/plan-math";
import { BASE_PUBLISH_PLATFORMS, publishPlatformLabel } from "@/lib/platforms";
import { cn } from "@/lib/utils";
import type { PlanStatus, PlanView } from "@/types/commerce";

const STATUS_STYLE: Record<PlanStatus, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  PENDING_PAYMENT: "bg-amber-400/15 text-amber-300",
  ACTIVE: "bg-emerald-400/15 text-emerald-300",
  PAST_DUE: "bg-destructive/15 text-destructive",
  CANCELED: "bg-muted text-muted-foreground",
};

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={cn("flex items-baseline justify-between gap-4 text-sm", strong && "border-t pt-3 text-base font-semibold")}>
      <span className={strong ? undefined : "text-muted-foreground"}>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

export async function PlanCard({ plan, payHref, billingHref }: { plan: PlanView; payHref: string; billingHref: string }) {
  const [t, tp, locale, format] = await Promise.all([getTranslations("billing.plan"), getTranslations("platforms"), getLocale(), getFormatter()]);
  const money = (cents: number) => formatMoney(cents, plan.currency, locale);
  const needsPayment = plan.status === "PENDING_PAYMENT" || plan.status === "DRAFT";

  return (
    <section className="flex flex-col gap-5 rounded-xl border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs text-muted-foreground">{needsPayment ? t("exclusive") : t("title")}</p>
          <h2 className="mt-0.5 text-lg font-semibold">{plan.tierName}</h2>
        </div>
        <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", STATUS_STYLE[plan.status])}>{t(`status.${plan.status}`)}</span>
      </div>

      {plan.status === "PAST_DUE" && <p className="rounded-md bg-destructive/15 px-3 py-2 text-sm text-destructive">{t("pastDue")}</p>}

      <div className="flex flex-col gap-2.5">
        {plan.allInclusiveFee === null ? (
          <>
            <Row label={t("baseFee")} value={money(plan.baseFee)} />
            {plan.extraPlatforms.length > 0 && (
              <Row label={t("extraPlatforms", { count: plan.extraPlatforms.length })} value={`${plan.extraPlatforms.length} × ${money(plan.extraPlatformFee)}`} />
            )}
          </>
        ) : (
          <Row label={t("allInclusive")} value={money(plan.allInclusiveFee)} />
        )}
        <Row label={t("monthlyTotal")} value={`${money(monthlyTotal(plan))} ${t("perMonth")}`} strong />
        <p className="text-xs text-muted-foreground">{t("includes", { credits: plan.monthlyCredits, videos: plan.monthlyVideos })}</p>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs text-muted-foreground">{t("platforms")}</span>
        <div className="flex flex-wrap gap-1.5">
          {BASE_PUBLISH_PLATFORMS.map((p) => (
            <span key={p} className="rounded-md border px-2 py-1 text-xs">{tp(`publish.${p}`)}</span>
          ))}
          {plan.extraPlatforms.map((p) => (
            <span key={p} className="rounded-md border border-primary/40 bg-primary/10 px-2 py-1 text-xs text-primary">
              {publishPlatformLabel(tp, p)} · {t("extraTag")}
            </span>
          ))}
        </div>
      </div>

      {needsPayment ? (
        <div className="flex flex-col gap-2">
          <Link href={payHref} className={cn(buttonVariants({ size: "lg" }), "h-10 w-full gap-2 sm:w-auto sm:self-start sm:px-6")}>
            <CreditCard className="size-4" /> {t("pay")} · {money(monthlyTotal(plan))}
          </Link>
          <p className="text-xs text-muted-foreground">{t("payHint")}</p>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-sm">
          <span className="text-muted-foreground">
            {plan.currentPeriodEnd &&
              t(plan.billing === "OFFLINE" ? "offlineUntil" : "renewsOn", { date: format.dateTime(plan.currentPeriodEnd, { dateStyle: "medium" }) })}
          </span>
          {plan.billing === "STRIPE" && (
            <Link href={billingHref} className={cn(buttonVariants({ variant: "outline" }), "gap-1.5")}>
              {t("manageBilling")} <ExternalLink className="size-3.5" />
            </Link>
          )}
        </div>
      )}
    </section>
  );
}
