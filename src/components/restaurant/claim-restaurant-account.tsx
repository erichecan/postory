"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { claimRestaurantCampaignFormAction } from "@/lib/actions/restaurant-campaigns";

export function ClaimRestaurantAccount({ token }: { token: string }) {
  const t = useTranslations("restaurantRequest.claimForm");
  const [state, action, pending] = useActionState(claimRestaurantCampaignFormAction, undefined);
  const errors: Record<string, string> = {
    invalidLink: t("errors.invalidLink"),
    verifiedEmailMismatch: t("errors.verifiedEmailMismatch"),
    alreadyLinked: t("errors.alreadyLinked"),
  };
  return <form action={action} className="mt-6 rounded-xl border bg-card p-5"><input type="hidden" name="token" value={token}/><p className="text-sm text-muted-foreground">{t("matchHint")}</p>{state?.error && <p role="alert" className="mt-3 text-sm text-destructive">{errors[state.error] ?? state.error}</p>}<button disabled={pending} className="mt-4 rounded-lg bg-primary px-4 py-2 text-primary-foreground disabled:opacity-60">{pending ? t("connecting") : t("connect")}</button></form>;
}
