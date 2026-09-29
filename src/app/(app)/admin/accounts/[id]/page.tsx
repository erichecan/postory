import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { AdjustCreditsForm } from "@/components/admin/adjust-credits-form";
import { PlanForm, type PlanDraft } from "@/components/admin/plan-form";
import { TxnTable } from "@/components/billing/txn-table";
import { requireAdmin } from "@/lib/auth/session";
import { DEFAULT_PLAN } from "@/lib/billing/plan-math";
import { getCustomer, listCustomerTxns } from "@/lib/db/admin-customers";
import { getBalance } from "@/lib/db/credits";
import { listTiers } from "@/lib/db/plans";

export default async function CustomerPage({ params }: PageProps<"/admin/accounts/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const customer = await getCustomer(id);
  if (!customer) notFound();
  const locale = await getLocale();
  const [t, tiers, balance, txns] = await Promise.all([getTranslations("admin.customer"), listTiers(locale), getBalance(id), listCustomerTxns(id)]);
  const plan = customer.plan;
  const tier = tiers.find((x) => x.recommended) ?? tiers[0];
  const draft: PlanDraft = plan
    ? {
        tierId: plan.tierId,
        currency: plan.currency,
        baseFee: plan.baseFee,
        extraPlatforms: plan.extraPlatforms,
        extraPlatformFee: plan.extraPlatformFee,
        allInclusiveFee: plan.allInclusiveFee,
        monthlyCredits: plan.monthlyCredits,
        monthlyVideos: plan.monthlyVideos,
        topupUnitPrice: plan.topupUnitPrice,
      }
    : {
        tierId: tier?.id ?? "",
        currency: "EUR",
        baseFee: DEFAULT_PLAN.baseFee,
        extraPlatforms: [],
        extraPlatformFee: DEFAULT_PLAN.extraPlatformFee,
        allInclusiveFee: null,
        monthlyCredits: tier?.defaultMonthlyCredits ?? DEFAULT_PLAN.monthlyCredits,
        monthlyVideos: tier?.defaultMonthlyVideos ?? DEFAULT_PLAN.monthlyVideos,
        topupUnitPrice: DEFAULT_PLAN.topupUnitPrice,
      };

  return (
    <div className="mx-auto flex max-w-[1080px] flex-col gap-6 px-4 py-10">
      <Link href="/admin/accounts" className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> {t("back")}
      </Link>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{customer.profile?.shopName ?? customer.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{[customer.name, customer.email, customer.phone].filter(Boolean).join(" · ")}</p>
      </header>
      <PlanForm userId={customer.id} tiers={tiers} initial={draft} saved={plan ? { status: plan.status, billing: plan.billing, currentPeriodEnd: plan.currentPeriodEnd } : null} />
      <AdjustCreditsForm userId={customer.id} balance={balance.total} />
      <TxnTable txns={txns} title={t("txnsTitle")} showNotes />
    </div>
  );
}
