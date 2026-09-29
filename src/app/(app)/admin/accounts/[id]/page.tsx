import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { AdjustCreditsForm } from "@/components/admin/adjust-credits-form";
import { PlanForm } from "@/components/admin/plan-form";
import { TxnTable } from "@/components/billing/txn-table";
import { requireAdmin } from "@/lib/auth/session";
import { mockBalance, mockCustomer, mockPlan, mockTiers, mockTxns } from "@/lib/mock/commerce";

export default async function CustomerPage() {
  await requireAdmin();
  const [t, locale] = await Promise.all([getTranslations("admin.customer"), getLocale()]);
  const customer = mockCustomer();
  const plan = mockPlan(locale, "pending");
  if (!plan) return null;
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
      <PlanForm tiers={mockTiers(locale)} initial={draft} />
      <AdjustCreditsForm balance={mockBalance("active").total} />
      <TxnTable txns={mockTxns()} title={t("txnsTitle")} />
    </div>
  );
}
