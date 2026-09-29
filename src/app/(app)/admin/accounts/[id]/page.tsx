import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { AdjustCreditsForm } from "@/components/admin/adjust-credits-form";
import { PlanForm } from "@/components/admin/plan-form";
import { TxnTable } from "@/components/billing/txn-table";
import { requireAdmin } from "@/lib/auth/session";
import { listTiers } from "@/lib/db/plans";
import { mockBalance, mockCustomer, mockPlan, mockTxns } from "@/lib/mock/commerce";

export default async function CustomerPage() {
  await requireAdmin();
  const locale = await getLocale();
  const [t, tiers] = await Promise.all([getTranslations("admin.customer"), listTiers(locale)]);
  const customer = mockCustomer();
  const plan = mockPlan(tiers[0]?.id ?? "", tiers[0]?.name ?? "");
  const draft = {
    tierId: plan.tierId,
    currency: plan.currency,
    baseFee: plan.baseFee,
    extraPlatforms: plan.extraPlatforms,
    extraPlatformFee: plan.extraPlatformFee,
    allInclusiveFee: plan.allInclusiveFee,
    monthlyCredits: plan.monthlyCredits,
    monthlyVideos: plan.monthlyVideos,
    topupUnitPrice: plan.topupUnitPrice,
  };

  return (
    <div className="mx-auto flex max-w-[1080px] flex-col gap-6 px-4 py-10">
      <Link href="/admin/accounts" className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> {t("back")}
      </Link>
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{customer.shopName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{customer.name} · {customer.email}</p>
        </div>
      </header>
      <PlanForm tiers={tiers} initial={draft} />
      <AdjustCreditsForm balance={mockBalance().total} />
      <TxnTable txns={mockTxns()} title={t("txnsTitle")} />
    </div>
  );
}
