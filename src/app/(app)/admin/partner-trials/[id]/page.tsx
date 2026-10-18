import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ConvertTrialForm } from "@/components/admin/convert-trial-form";
import { requireAdmin } from "@/lib/auth/session";
import { getTrialRequestById } from "@/lib/db/partner-trials";

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
          <p className="text-sm">{trial.country}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{t("fieldProduct")}</p>
          <p className="text-sm">{trial.productOrService}</p>
        </div>
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
