"use client";

import { useActionState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCustomerAction } from "@/lib/actions/customers";

export function CreateCustomerForm() {
  const t = useTranslations("customers.form");
  const [state, action, pending] = useActionState(createCustomerAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) {
      toast.success(state.message ?? t("success"));
      formRef.current?.reset();
    }
  }, [state, t]);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-4 rounded-xl border bg-card p-5">
      <div>
        <h2 className="font-semibold">{t("title")}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{t("hint")}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="c-name">{t("name")}</Label>
          <Input id="c-name" name="name" className="h-9" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="c-email">{t("email")}</Label>
          <Input id="c-email" name="email" type="email" className="h-9" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="c-phone">{t("phone")}</Label>
          <Input id="c-phone" name="phone" className="h-9" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="c-birthday">{t("birthday")}</Label>
          <Input id="c-birthday" name="birthday" type="date" className="h-9" />
        </div>
      </div>
      {state?.error && <p className="rounded-md bg-destructive/15 px-3 py-2 text-sm text-destructive">{state.error}</p>}
      <div>
        <Button type="submit" disabled={pending}>{pending ? t("submitting") : t("submit")}</Button>
      </div>
    </form>
  );
}
