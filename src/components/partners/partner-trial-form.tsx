"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitPartnerTrialAction } from "@/lib/actions/partner-trials";
import { PUBLISH_PLATFORMS } from "@/lib/platforms";
import type { Country, Industry } from "@/generated/prisma/client";

const INDUSTRY_OPTIONS = ["FOOD_TAKEAWAY", "BEAUTY_HAIR", "FITNESS", "PHONE_REPAIR", "OTHER"] as const satisfies readonly Industry[];
const COUNTRY_OPTIONS = ["IE", "CA"] as const satisfies readonly Country[];

export function PartnerTrialForm() {
  const t = useTranslations("partners.trial");
  const ti = useTranslations("profile.industryOptions");
  const tc = useTranslations("profile.countryOptions");
  const tp = useTranslations("platforms.publish");
  const [state, action, pending] = useActionState(submitPartnerTrialAction, undefined);

  return (
    <form action={action} className="mx-auto flex w-full max-w-3xl flex-col gap-6 rounded-2xl border bg-card p-5 shadow-sm sm:p-8">
      <p className="rounded-lg border border-primary/15 bg-primary/5 px-4 py-3 text-sm leading-relaxed">{t("scopeNote")}</p>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-1 text-base font-semibold">{t("agencySection")}</legend>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="agencyName">{t("agencyName")}</Label>
          <Input id="agencyName" name="agencyName" required maxLength={64} className="h-10" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="agencyContact">{t("agencyContact")}</Label>
          <Input id="agencyContact" name="agencyContact" required maxLength={128} className="h-10" />
        </div>
      </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4 border-t pt-5">
        <legend className="mb-1 text-base font-semibold">{t("clientSection")}</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="clientBrandName">{t("clientBrandName")}</Label>
            <Input id="clientBrandName" name="clientBrandName" required maxLength={128} className="h-10" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="industry">{t("industry")}</Label>
            <select id="industry" name="industry" required defaultValue="" className="h-10 rounded-lg border bg-input/30 px-3 text-sm">
              <option value="" disabled>{t("industry")}</option>
              {INDUSTRY_OPTIONS.map((v) => <option key={v} value={v}>{ti(v)}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="country">{t("country")}</Label>
            <select id="country" name="country" required defaultValue="" className="h-10 rounded-lg border bg-input/30 px-3 text-sm">
              <option value="" disabled>{t("country")}</option>
              {COUNTRY_OPTIONS.map((v) => <option key={v} value={v}>{tc(v)}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="marketArea">{t("marketArea")}</Label>
            <Input id="marketArea" name="marketArea" required maxLength={128} placeholder={t("marketAreaPlaceholder")} className="h-10" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="languagePreference">{t("languagePreference")}</Label>
            <Input id="languagePreference" name="languagePreference" required maxLength={64} placeholder={t("languagePreferencePlaceholder")} defaultValue="zh" className="h-10" />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="productOrService">{t("productOrService")}</Label>
          <Textarea id="productOrService" name="productOrService" required maxLength={2000} className="min-h-24" />
        </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="targetAudience">{t("targetAudience")}</Label>
          <Textarea id="targetAudience" name="targetAudience" required maxLength={2000} className="min-h-20" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="highlightNotes">{t("highlightNotes")}</Label>
          <Textarea id="highlightNotes" name="highlightNotes" required maxLength={2000} className="min-h-20" />
        </div>
      </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4 border-t pt-5">
        <legend className="mb-1 text-base font-semibold">{t("platformAssetsSection")}</legend>
      <div className="flex flex-col gap-1.5">
        <Label>{t("platforms")}</Label>
        <div className="flex flex-wrap gap-2">
          {PUBLISH_PLATFORMS.map((p) => (
            <label key={p} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/5">
              <input type="checkbox" name="platforms" value={p} className="size-4 rounded border accent-primary" />
              {tp(p)}
            </label>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="websiteUrl">{t("websiteUrl")}</Label>
          <Input id="websiteUrl" name="websiteUrl" type="url" maxLength={300} className="h-9" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="socialHandles">{t("socialHandles")}</Label>
          <Input id="socialHandles" name="socialHandles" maxLength={1000} className="h-9" />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="referenceFiles">{t("referenceFiles")}</Label>
        <input id="referenceFiles" name="referenceFiles" type="file" accept="image/png,image/jpeg,image/webp" multiple className="text-sm" />
        <p className="text-xs text-muted-foreground">{t("referenceFilesHint")}</p>
      </div>
      </fieldset>

      {state?.error && <p className="rounded-md bg-destructive/15 px-3 py-2 text-sm text-destructive">{state.error}</p>}

      <div>
        <Button type="submit" disabled={pending}>{pending ? t("submitting") : t("submit")}</Button>
      </div>
    </form>
  );
}
