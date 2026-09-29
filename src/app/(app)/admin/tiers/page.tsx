import { getTranslations } from "next-intl/server";
import { AdminSubnav } from "@/components/admin/admin-subnav";
import { TierEditor } from "@/components/admin/tier-editor";
import { requireAdmin } from "@/lib/auth/session";
import type { TierFeatures } from "@/lib/billing/tier-features";
import { listAllTiers } from "@/lib/db/admin-customers";

export default async function TiersPage() {
  await requireAdmin();
  const [tiers, t] = await Promise.all([listAllTiers(), getTranslations("admin.tiers")]);
  return (
    <div className="mx-auto flex max-w-[1080px] flex-col gap-6 px-4 py-10">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <AdminSubnav active="tiers" />
      </header>
      {tiers.map((tier) => (
        <TierEditor
          key={tier.id}
          initial={{
            id: tier.id,
            nameZh: tier.nameZh,
            nameEn: tier.nameEn,
            taglineZh: tier.taglineZh,
            taglineEn: tier.taglineEn,
            benefitsZh: tier.benefitsZh,
            benefitsEn: tier.benefitsEn,
            features: tier.features as TierFeatures,
            defaultMonthlyCredits: tier.defaultMonthlyCredits,
            defaultMonthlyVideos: tier.defaultMonthlyVideos,
            referenceFee: tier.referenceFee,
            recommended: tier.recommended,
            visible: tier.visible,
            sortOrder: tier.sortOrder,
          }}
        />
      ))}
    </div>
  );
}
