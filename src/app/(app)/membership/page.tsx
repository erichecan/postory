import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { BalanceCard } from "@/components/billing/balance-card";
import { ContactButton } from "@/components/billing/contact-button";
import { CostRules } from "@/components/billing/cost-rules";
import { PlanCard } from "@/components/billing/plan-card";
import { TierCards } from "@/components/billing/tier-cards";
import { TxnTable } from "@/components/billing/txn-table";
import { Pagination } from "@/components/templates/pagination";
import { requireUser } from "@/lib/auth/session";
import { getBalance, listTxns } from "@/lib/db/credits";
import { getPlanView, listTiers } from "@/lib/db/plans";
import { DEMO_PHONE } from "@/lib/demo";

export default async function MembershipPage({ searchParams }: PageProps<"/membership">) {
  const user = await requireUser();
  const { page } = await searchParams;
  const txnPage = Math.max(1, Number.parseInt(typeof page === "string" ? page : "1", 10) || 1);
  const locale = await getLocale();
  const [t, tn, tp, plan, balance, txns] = await Promise.all([
    getTranslations("billing.page"),
    getTranslations("billing.plan.none"),
    getTranslations("plans"),
    getPlanView(user.id, locale),
    getBalance(user.id),
    listTxns(user.id, txnPage),
  ]);
  const tiers = plan ? [] : await listTiers(locale);
  const canTopup = plan?.status === "ACTIVE" && user.phone !== DEMO_PHONE;

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
          <PlanCard plan={plan} payHref="/membership" billingHref="/membership" />
        ) : (
          <section className="flex flex-col justify-center gap-3 rounded-xl border border-dashed p-6">
            <h2 className="text-lg font-semibold">{tn("title")}</h2>
            <p className="text-sm text-muted-foreground">{tn("body")}</p>
            <ContactButton label={`${tn("contact")} →`} variant="link" className="self-start" />
          </section>
        )}
        <div className="flex flex-col gap-5">
          <BalanceCard balance={balance} topup={canTopup && plan ? { currency: plan.currency, unitPrice: plan.topupUnitPrice } : null} />
          <CostRules />
        </div>
      </div>

      {!plan && <TierCards tiers={tiers} />}

      <div className="flex flex-col gap-4">
        <TxnTable txns={txns.items} />
        <Pagination page={txnPage} pageCount={txns.pageCount} makeHref={(p) => (p > 1 ? `/membership?page=${p}` : "/membership")} />
      </div>
    </div>
  );
}
