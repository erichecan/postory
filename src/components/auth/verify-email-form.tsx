"use client";

import Link from "next/link";
import { useActionState, useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resendVerifyCodeAction, verifyEmailAction } from "@/lib/actions/auth";

const COOLDOWN_SEC = 60;

export function VerifyEmailForm({ email, sendFailed = false }: { email: string; sendFailed?: boolean }) {
  const t = useTranslations("auth.verify");
  const tc = useTranslations("common");
  const [state, action, pending] = useActionState(verifyEmailAction, undefined);
  const [left, setLeft] = useState(sendFailed ? 0 : COOLDOWN_SEC);
  const [resending, startResend] = useTransition();

  useEffect(() => {
    if (left <= 0) return;
    const id = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [left]);

  function resend() {
    startResend(async () => {
      const res = await resendVerifyCodeAction();
      if (res?.error) toast.error(res.error);
      else {
        toast.success(res?.message ?? t("sent"));
        setLeft(COOLDOWN_SEC);
      }
    });
  }

  return (
    <form action={action} className="flex w-full max-w-sm flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle", { email })}</p>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="code">{t("code")}</Label>
        <Input id="code" name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} pattern="\d{6}" placeholder="000000" required autoFocus className="h-12 text-center font-mono text-2xl tracking-[0.5em]" />
      </div>
      {sendFailed && !state?.error && <p className="rounded-md bg-amber-400/15 px-3 py-2 text-sm text-amber-300">{t("sendFailedNotice")}</p>}
      {state?.error && <p className="rounded-md bg-destructive/15 px-3 py-2 text-sm text-destructive">{state.error}</p>}
      <Button type="submit" size="lg" className="h-10" disabled={pending}>{pending ? tc("loading") : t("submit")}</Button>
      <div className="flex items-center justify-between text-sm">
        <Button type="button" variant="link" className="h-auto p-0" onClick={resend} disabled={left > 0 || resending}>
          {left > 0 ? t("resendIn", { sec: left }) : t("resend")}
        </Button>
        <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">{t("skip")}</Link>
      </div>
    </form>
  );
}
