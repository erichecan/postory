import { getFormatter, getTranslations } from "next-intl/server";
import { ContactButton } from "@/components/billing/contact-button";
import { PartnerTrialFeedbackForm } from "@/components/partners/partner-trial-feedback-form";
import { PartnerTrialSupplementForm } from "@/components/partners/partner-trial-supplement-form";
import { missingTrialFields, parsePlatformVariants, type PartnerTrialDetail } from "@/lib/partners/trial-view";
import { partnersAssetUrl, partnersRefUrl } from "@/lib/storage";
import { isPublishPlatform } from "@/lib/platforms";

export async function PartnerTrialView({ trial, token }: { trial: PartnerTrialDetail; token: string }) {
  const [t, format, tp] = await Promise.all([getTranslations("partners.view"), getFormatter(), getTranslations("platforms.publish")]);
  const missing = missingTrialFields(trial);

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-2 rounded-xl border bg-card p-5">
        <p className="text-sm">
          <span className="font-medium">{t("statusLabel")}：</span>
          {t(`status.${trial.status}`)}
        </p>
        <p className="text-xs text-muted-foreground">{t("scopeNote")}</p>
      </section>

      <section className="flex flex-col gap-2 rounded-xl border bg-card p-5">
        <h2 className="font-semibold">{missing.length > 0 ? t("missingTitle") : t("missingNone")}</h2>
        {missing.length > 0 && (
          <>
            <ul className="list-inside list-disc text-sm text-muted-foreground">
              {missing.map((field) => (
                <li key={field}>{t(`missing.${field}`)}</li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground">{t("missingHint")}</p>
          </>
        )}
      </section>

      {trial.status !== "CONVERTED" && <PartnerTrialSupplementForm trial={trial} token={token} />}

      <section className="flex flex-col gap-3 rounded-xl border bg-card p-5">
        <h2 className="font-semibold">{t("planTitle")}</h2>
        {trial.planItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("planEmpty")}</p>
        ) : (
          <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {trial.planItems.map((item, index) => (
              <li key={item.id} className="flex flex-col gap-2 rounded-xl border bg-background p-4">
                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-primary">{t("planDay", { day: index + 1 })}</span>
                  <time dateTime={item.date.toISOString()}>{format.dateTime(item.date, { month: "short", day: "numeric", timeZone: "UTC" })}</time>
                </div>
                <p className="font-medium">{item.theme}</p>
                <p className="w-fit rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                  {isPublishPlatform(item.platform) ? tp(item.platform) : item.platform}
                </p>
                {item.note && <p className="text-sm leading-relaxed text-muted-foreground">{item.note}</p>}
              </li>
            ))}
          </ol>
        )}
        <p className="text-xs leading-relaxed text-muted-foreground">{t("planNote")}</p>
      </section>

      <section className="flex flex-col gap-3 rounded-xl border bg-card p-5">
        <h2 className="font-semibold">{t("assetsTitle")}</h2>
        <p className="text-xs text-muted-foreground">{t("assetQuotaNote")}</p>
        {trial.assets.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("assetsEmpty")}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {trial.assets.map((asset) => {
              const variants = parsePlatformVariants(asset.platformVariants);
              return (
                <div key={asset.id} className="flex flex-col gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={partnersAssetUrl(asset.storageKey)} alt={asset.caption ?? ""} className="aspect-square w-full rounded-lg border object-cover" />
                  {asset.caption && <p className="text-xs text-muted-foreground">{asset.caption}</p>}
                  {variants.length > 0 && (
                    <div className="flex flex-col gap-1">
                      <p className="text-xs font-medium text-muted-foreground">{t("assetVariantsTitle")}</p>
                      <div className="flex flex-wrap gap-2">
                        {variants.map((v) => (
                          <a key={v.platform} href={v.exportedUrl} target="_blank" rel="noreferrer" className="rounded-full border bg-background px-2.5 py-1 text-xs text-primary hover:border-primary/40">
                            {isPublishPlatform(v.platform) ? tp(v.platform) : v.platform} ↗
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {trial.references.length > 0 && (
        <section className="flex flex-col gap-3 rounded-xl border bg-card p-5">
          <h2 className="font-semibold">{t("referencesTitle")}</h2>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {trial.references.map((ref) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={ref.id} src={partnersRefUrl(ref.storageKey)} alt="" className="aspect-square w-full rounded-lg border object-cover" />
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-3 rounded-xl border bg-card p-5">
        <h2 className="font-semibold">{t("feedbackTitle")}</h2>
        <PartnerTrialFeedbackForm token={token} />
        {trial.feedback.length > 0 && (
          <div className="flex flex-col gap-2 border-t pt-3">
            <p className="text-xs font-medium text-muted-foreground">{t("feedbackHistory")}</p>
            {trial.feedback.map((f) => (
              <p key={f.id} className="text-sm">
                <span className="text-xs text-muted-foreground">[{t(`feedbackCategoryOptions.${f.category}`)}]</span> {f.content}
              </p>
            ))}
          </div>
        )}
      </section>

      {trial.status !== "CONVERTED" && (
        <section className="flex flex-col gap-2 rounded-xl border bg-primary/5 p-5">
          <h2 className="font-semibold">{t("convertTitle")}</h2>
          <p className="text-sm text-muted-foreground">{t("convertBody")}</p>
          <ContactButton label={t("convertContact")} variant="outline" className="w-fit" />
        </section>
      )}
    </div>
  );
}
