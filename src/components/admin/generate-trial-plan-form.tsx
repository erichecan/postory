"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { adminGenerateTrialPlanAction } from "@/lib/actions/partner-trials-admin";

const PLAN_ERROR_KEYS = ["invalid", "notFound", "converted", "unavailable"] as const;

export function GenerateTrialPlanForm({ trialRequestId }: { trialRequestId: string }) {
  const t = useTranslations("admin.partnerTrials.plan");
  const [state, action, pending] = useActionState(adminGenerateTrialPlanAction, undefined);
  return (
    <form action={action} className="flex flex-col items-start gap-2 rounded-xl border bg-card p-5">
      <input type="hidden" name="trialRequestId" value={trialRequestId} />
      <p className="text-sm text-muted-foreground">{t("hint")}</p>
      <Button type="submit" disabled={pending}>{pending ? t("pending") : t("submit")}</Button>
      {state?.ok && <p className="text-sm text-primary">{t("success")}</p>}
      {state?.error && PLAN_ERROR_KEYS.some((key) => key === state.error) && <p className="text-sm text-destructive">{t(`errors.${state.error}` as `errors.${(typeof PLAN_ERROR_KEYS)[number]}`)}</p>}
    </form>
  );
}
