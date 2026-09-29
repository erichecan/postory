"use client";

import { useActionState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminCreateUserAction } from "@/lib/actions/admin";

export function CreateAccountForm() {
  const t = useTranslations("admin.form");
  const [state, action, pending] = useActionState(adminCreateUserAction, undefined);
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
        <div className="flex flex-col gap-1.5"><Label htmlFor="a-email">{t("email")}</Label><Input id="a-email" name="email" type="email" required className="h-9" /></div>
        <div className="flex flex-col gap-1.5"><Label htmlFor="a-phone">{t("phoneOptional")}</Label><Input id="a-phone" name="phone" inputMode="numeric" className="h-9" /></div>
        <div className="flex flex-col gap-1.5"><Label htmlFor="a-name">{t("name")}</Label><Input id="a-name" name="name" required className="h-9" /></div>
        <div className="flex flex-col gap-1.5"><Label htmlFor="a-pass">{t("password")}</Label><Input id="a-pass" name="password" placeholder={t("passwordPlaceholder")} required className="h-9" /></div>
      </div>
      {state?.error && <p className="rounded-md bg-destructive/15 px-3 py-2 text-sm text-destructive">{state.error}</p>}
      <div><Button type="submit" disabled={pending}>{pending ? t("submitting") : t("submit")}</Button></div>
    </form>
  );
}
