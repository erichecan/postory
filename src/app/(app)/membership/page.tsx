import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { BalanceCard } from "@/components/billing/balance-card";
import { CostRules } from "@/components/billing/cost-rules";
import { PlanCard } from "@/components/billing/plan-card";
import { TierCards } from "@/components/billing/tier-cards";
import { TxnTable } from "@/components/billing/txn-table";
import { requireUser } from "@/lib/auth/session";
import { CONTACT_HREF } from "@/lib/brand";
import { mockBalance, mockPlan, mockTiers, mockTxns, type MockPlanState } from "@/lib/mock/commerce";

function parseState(v: string | string[] | undefined): MockPlanState {
  return v === "pending" || v === "none" ? v : "active";
}

export default async function MembershipPage({ searchParams }: PageProps<"/membership">) {
  await requireUser();
  const sp = await searchParams;
  const state = parseState(sp.state);
  const [t, tn, tp, locale] = await Promise.all([getTranslations("billing.page"), getTranslations("billing.plan.none"), getTranslations("plans"), getLocale()]);
  const plan = mockPlan(locale, state);
  const balance = mockBalance(state, sp.empty === "1");

  return (
    <div className="mx-auto flex max-w-[1080px] flex-col gap-8 px-4 py-10">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Link href="/plans" className="text-sm text-primary hover:underline">{tp("compare")} →</Link>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        {plan ? (
          <PlanCard plan={plan} payHref="/membership?state=active" billingHref="/membership" />
        ) : (
          <section className="flex flex-col justify-center gap-3 rounded-xl border border-dashed p-6">
            <h2 className="text-lg font-semibold">{tn("title")}</h2>
            <p className="text-sm text-muted-foreground">{tn("body")}</p>
            <a href={CONTACT_HREF} className="text-sm text-primary hover:underline">{tn("contact")} →</a>
          </section>
        )}
        <div className="flex flex-col gap-5">
          <BalanceCard balance={balance} topup={plan?.status === "ACTIVE" ? { currency: plan.currency, unitPrice: plan.topupUnitPrice } : null} />
          <CostRules />
        </div>
      </div>

      {!plan && <TierCards tiers={mockTiers(locale)} contactHref={CONTACT_HREF} />}

      <TxnTable txns={state === "active" ? mockTxns() : mockTxns().slice(-1)} />
    </div>
  );
}
