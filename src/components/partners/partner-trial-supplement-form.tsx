"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updatePartnerTrialDetailsAction } from "@/lib/actions/partner-trials";
import { PUBLISH_PLATFORMS } from "@/lib/platforms";

const SUCCESS_KEYS = ["updatedWithPlan", "updatedWithoutPlan"] as const;

export function PartnerTrialSupplementForm({ trial, token }: { trial: {
  marketArea: string | null;
  productOrService: string;
  targetAudience: string | null;
  highlightNotes: string | null;
  websiteUrl: string | null;
  platforms: string[];
  languagePreference: string;
  references: Array<unknown>;
}; token: string }) {
  const t = useTranslations("partners.view.supplement");
  const tp = useTranslations("platforms.publish");
  const [state, action, pending] = useActionState(updatePartnerTrialDetailsAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-4 rounded-2xl border bg-card p-5 sm:p-6">
      <div>
        <h2 className="font-semibold">{t("title")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("hint")}</p>
      </div>
      <input type="hidden" name="token" value={token} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="supplement-market-area">{t("marketArea")}</Label>
          <Input id="supplement-market-area" name="marketArea" required maxLength={128} defaultValue={trial.marketArea ?? ""} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="supplement-language">{t("language")}</Label>
          <Input id="supplement-language" name="languagePreference" required maxLength={64} defaultValue={trial.languagePreference} />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="supplement-product">{t("product")}</Label>
        <Textarea id="supplement-product" name="productOrService" required maxLength={2000} defaultValue={trial.productOrService} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="supplement-audience">{t("audience")}</Label>
          <Textarea id="supplement-audience" name="targetAudience" maxLength={2000} defaultValue={trial.targetAudience ?? ""} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="supplement-highlights">{t("highlights")}</Label>
          <Textarea id="supplement-highlights" name="highlightNotes" maxLength={2000} defaultValue={trial.highlightNotes ?? ""} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="supplement-website">{t("website")}</Label>
          <Input id="supplement-website" name="websiteUrl" type="url" maxLength={300} defaultValue={trial.websiteUrl ?? ""} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="supplement-files">{t("references", { count: trial.references.length })}</Label>
          <Input id="supplement-files" name="referenceFiles" type="file" accept="image/png,image/jpeg,image/webp" multiple disabled={trial.references.length >= 5} />
        </div>
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">{t("platforms")}</legend>
        <div className="flex flex-wrap gap-2">
          {PUBLISH_PLATFORMS.map((platform) => (
            <label key={platform} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/5">
              <input type="checkbox" name="platforms" value={platform} defaultChecked={trial.platforms.includes(platform)} className="size-4 rounded border accent-primary" />
              {tp(platform)}
            </label>
          ))}
        </div>
      </fieldset>
      {state?.error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>}
      {state?.ok && state.message && SUCCESS_KEYS.some((key) => key === state.message) && <p className="rounded-md bg-primary/5 px-3 py-2 text-sm text-primary">{t(state.message as (typeof SUCCESS_KEYS)[number])}</p>}
      <div><Button type="submit" disabled={pending}>{pending ? t("pending") : t("submit")}</Button></div>
    </form>
  );
}
