"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminConvertTrialAction } from "@/lib/actions/partner-trials-admin";

export function ConvertTrialForm({ trialRequestId, needsAgencyEmail }: { trialRequestId: string; needsAgencyEmail: boolean }) {
  const t = useTranslations("admin.partnerTrials");
  const [state, action, pending] = useActionState(adminConvertTrialAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-4 rounded-xl border bg-primary/5 p-5">
      <div>
        <h2 className="font-semibold">{t("formTitle")}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{t("formHint")}</p>
      </div>
      <input type="hidden" name="trialRequestId" value={trialRequestId} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ct-email">{t("email")}</Label>
          <Input id="ct-email" name="email" type="email" required className="h-9" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ct-phone">{t("phoneOptional")}</Label>
          <Input id="ct-phone" name="phone" inputMode="numeric" className="h-9" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ct-name">{t("name")}</Label>
          <Input id="ct-name" name="name" required className="h-9" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ct-pass">{t("password")}</Label>
          <Input id="ct-pass" name="password" placeholder={t("passwordPlaceholder")} required className="h-9" />
        </div>
      </div>
      {needsAgencyEmail && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ct-agency-email">{t("agencyEmail")}</Label>
          <Input id="ct-agency-email" name="agencyEmail" type="email" required className="h-9" />
        </div>
      )}
      {state?.error && <p className="rounded-md bg-destructive/15 px-3 py-2 text-sm text-destructive">{state.error}</p>}
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? t("submitting") : t("submit")}
        </Button>
      </div>
    </form>
  );
}
