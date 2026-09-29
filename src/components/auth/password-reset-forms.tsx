"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestResetAction, resetPasswordAction } from "@/lib/actions/auth";

function Shell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="flex w-full max-w-sm flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

export function ForgotPasswordForm() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const [state, action, pending] = useActionState(requestResetAction, undefined);
  return (
    <Shell title={t("forgot.title")} subtitle={t("forgot.subtitle")}>
      {state?.ok ? (
        <p className="rounded-md bg-emerald-500/15 px-3 py-2.5 text-sm leading-relaxed text-emerald-300">{state.message}</p>
      ) : (
        <form action={action} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">{t("email")}</Label>
            <Input id="email" name="email" type="email" autoComplete="email" placeholder={t("emailPlaceholder")} required className="h-10" />
          </div>
          {state?.error && <p className="rounded-md bg-destructive/15 px-3 py-2 text-sm text-destructive">{state.error}</p>}
          <Button type="submit" size="lg" className="h-10" disabled={pending}>{pending ? tc("loading") : t("forgot.submit")}</Button>
        </form>
      )}
      <Link href="/login" className="text-center text-sm text-primary hover:underline">{t("forgot.back")}</Link>
    </Shell>
  );
}

export function ResetPasswordForm({ email, token }: { email: string; token: string }) {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const [state, action, pending] = useActionState(resetPasswordAction, undefined);
  return (
    <Shell title={t("reset.title")} subtitle={t("reset.subtitle", { email })}>
      <form action={action} className="flex flex-col gap-5">
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="token" value={token} />
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">{t("reset.password")}</Label>
          <Input id="password" name="password" type="password" autoComplete="new-password" placeholder={t("passwordPlaceholder")} required className="h-10" />
        </div>
        {state?.error && (
          <p className="rounded-md bg-destructive/15 px-3 py-2 text-sm text-destructive">
            {state.error} <Link href="/forgot-password" className="underline">{t("reset.again")}</Link>
          </p>
        )}
        <Button type="submit" size="lg" className="h-10" disabled={pending}>{pending ? tc("loading") : t("reset.submit")}</Button>
      </form>
    </Shell>
  );
}
