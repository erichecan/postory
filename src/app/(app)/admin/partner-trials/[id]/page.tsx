import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ConvertTrialForm } from "@/components/admin/convert-trial-form";
import { GenerateTrialPlanForm } from "@/components/admin/generate-trial-plan-form";
import { AddTrialAssetForm } from "@/components/admin/add-trial-asset-form";
import { requireAdmin } from "@/lib/auth/session";
import { getTrialRequestById } from "@/lib/db/partner-trials";
import { partnersAssetUrl } from "@/lib/storage";

export default async function PartnerTrialDetailPage({ params }: PageProps<"/admin/partner-trials/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const trial = await getTrialRequestById(id);
  if (!trial) notFound();
  const [t, tv] = await Promise.all([getTranslations("admin.partnerTrials"), getTranslations("partners.view")]);

  return (
    <div className="mx-auto flex max-w-[800px] flex-col gap-6 px-4 py-10">
      <Link href="/admin/partner-trials" className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> {t("back")}
      </Link>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{trial.clientBrandName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("statusLabel")}：{tv(`status.${trial.status}`)}
        </p>
      </header>

      <section className="grid gap-3 rounded-xl border bg-card p-5 sm:grid-cols-2">
        <div>
          <p className="text-xs text-muted-foreground">{t("fieldAgencyName")}</p>
          <p className="text-sm">{trial.agencyName}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{t("fieldAgencyContact")}</p>
          <p className="text-sm">{trial.agencyContact}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{t("fieldAgencyAccount")}</p>
          <p className="text-sm">{trial.agencyUserId ?? t("fieldAgencyNone")}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{t("fieldIndustry")}</p>
          <p className="text-sm">{trial.industry}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{t("fieldCountry")}</p>
          <p className="text-sm">{trial.country}{trial.marketArea ? ` · ${trial.marketArea}` : ""}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{t("fieldProduct")}</p>
          <p className="text-sm">{trial.productOrService}</p>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-xl border bg-card p-5">
        <div>
          <h2 className="font-semibold">{t("plan.title", { count: trial.planItems.length })}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{t("plan.preview")}</p>
        </div>
        {trial.planItems.length > 0 && (
          <ol className="grid gap-2 sm:grid-cols-2">
            {trial.planItems.map((item, index) => (
              <li key={item.id} className="rounded-lg border p-3 text-sm">
                <span className="text-xs font-medium text-primary">{t("plan.day", { day: index + 1 })} · {item.platform}</span>
                <p className="mt-1 font-medium">{item.theme}</p>
                {item.note && <p className="mt-1 text-xs text-muted-foreground">{item.note}</p>}
              </li>
            ))}
          </ol>
        )}
        {trial.status !== "CONVERTED" && <GenerateTrialPlanForm trialRequestId={trial.id} />}
      </section>

      <section className="flex flex-col gap-3 rounded-xl border bg-card p-5">
        <h2 className="font-semibold">{t("assets.delivered", { count: trial.assets.length })}</h2>
        {trial.assets.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-3">
            {trial.assets.map((asset) => (
              <div key={asset.id} className="flex flex-col gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={partnersAssetUrl(asset.storageKey)} alt="" className="aspect-square w-full rounded-lg border object-cover" />
                <p className="text-sm">{asset.caption || t("assets.untitled")}</p>
              </div>
            ))}
          </div>
        )}
        {trial.assets.length < 3 && trial.status !== "CONVERTED" && (
          <AddTrialAssetForm trialRequestId={trial.id} platforms={trial.platforms} remaining={3 - trial.assets.length} />
        )}
      </section>

      {trial.status === "CONVERTED" ? (
        <section className="flex flex-col gap-2 rounded-xl border bg-card p-5">
          <h2 className="font-semibold">{t("convertedTitle")}</h2>
          {trial.convertedUserId && (
            <Link className="text-sm text-primary hover:underline" href={`/admin/accounts/${trial.convertedUserId}`}>
              {t("convertedBody")}
            </Link>
          )}
        </section>
      ) : (
        <ConvertTrialForm trialRequestId={trial.id} needsAgencyEmail={trial.agencyUserId === null} />
      )}
    </div>
  );
}
