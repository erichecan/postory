"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { demoLoginAction } from "@/lib/actions/auth";
import { DEMO_PROFILE } from "@/lib/demo";

export function DemoLogin() {
  const [state, formAction, pending] = useActionState(demoLoginAction, undefined);
  const t = useTranslations("auth.demo");
  return (
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-2">
      <Button type="submit" size="lg" className="h-11 text-[15px]" disabled={pending}>
        {pending ? t("pending") : t("submit")}
      </Button>
      <p className="text-center text-xs text-muted-foreground">{t("hint", { shopName: DEMO_PROFILE.shopName })}</p>
      {state?.error && <p className="rounded-md bg-destructive/15 px-3 py-2 text-sm text-destructive">{state.error}</p>}
      <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        {t("divider")}
        <span className="h-px flex-1 bg-border" />
      </div>
    </form>
  );
}
