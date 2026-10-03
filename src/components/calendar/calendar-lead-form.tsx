"use client";

import { useActionState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitCalendarLeadAction } from "@/lib/actions/calendar-lead";
import type { Country, Industry } from "@/generated/prisma/client";

export function CalendarLeadForm({ industry, country }: { industry: Industry; country: Country }) {
  const t = useTranslations("calendar.preview");
  const [state, action, pending] = useActionState(submitCalendarLeadAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  if (state?.ok) {
    return (
      <div className="mx-auto w-full max-w-xl rounded-xl border bg-card p-6 text-center text-sm">{t("success")}</div>
    );
  }

  return (
    <form ref={formRef} action={action} className="mx-auto flex w-full max-w-xl flex-col gap-4 rounded-xl border bg-card p-6">
      <input type="hidden" name="industry" value={industry} />
      <input type="hidden" name="country" value={country} />
      <div>
        <h2 className="font-semibold">{t("formTitle")}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{t("formSubtitle")}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="shopName">{t("shopName")}</Label>
          <Input id="shopName" name="shopName" required className="h-9" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contactEmail">{t("contactEmail")}</Label>
          <Input id="contactEmail" name="contactEmail" type="email" required className="h-9" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contactPhone">{t("contactPhone")}</Label>
          <Input id="contactPhone" name="contactPhone" className="h-9" />
        </div>
      </div>
      {state?.error && <p className="rounded-md bg-destructive/15 px-3 py-2 text-sm text-destructive">{state.error}</p>}
      <div>
        <Button type="submit" disabled={pending}>{pending ? t("submitting") : t("submit")}</Button>
      </div>
    </form>
  );
}
