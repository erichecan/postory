"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestNailsCodeAction, verifyNailsCodeAction } from "@/lib/actions/nails-auth";
import type { FormState } from "@/lib/validation";

function CodeForm({ email, next, onChangeEmail }: { email: string; next: string; onChangeEmail: () => void }) {
  const t = useTranslations("nails");
  const [state, action, pending] = useActionState(verifyNailsCodeAction, undefined);
  const [left, setLeft] = useState(60);
  const [resend, resendAction, resending] = useActionState(async (previous: FormState, data: FormData) => {
    const result = await requestNailsCodeAction(previous, data);
    if (result?.ok) setLeft(60);
    return result;
  }, undefined);
  useEffect(() => {
    if (left <= 0) return;
    const timer = setTimeout(() => setLeft((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [left]);
  return <div className="space-y-5">
    <p role="status" className="break-words text-sm leading-7 text-muted-foreground">{t("codeSent", { email })}</p>
    <form action={action} className="space-y-5">
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="next" value={next} />
      <div className="space-y-2">
        <Label htmlFor="login-code">{t("code")}</Label>
        <Input id="login-code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={6} required autoFocus placeholder="000000" className="h-14 text-center text-2xl tracking-[0.4em]" />
      </div>
      {state?.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" className="h-12 w-full" disabled={pending}>{t(pending ? "working" : "verifyCode")}</Button>
    </form>
    <form action={resendAction}>
      <input type="hidden" name="email" value={email} />
      {resend?.error && <p role="alert" className="mb-3 text-sm text-destructive">{resend.error}</p>}
      <Button type="submit" variant="outline" className="min-h-11 w-full" disabled={left > 0 || resending || pending}>{left > 0 ? t("resendIn", { seconds: left }) : t("resendCode")}</Button>
    </form>
    <Button type="button" variant="ghost" className="min-h-11 w-full" onClick={onChangeEmail} disabled={pending || resending}>{t("changeEmail")}</Button>
  </div>;
}

function EmailForm({ onSent }: { onSent: (email: string) => void }) {
  const t = useTranslations("nails");
  const [state, action, pending] = useActionState(async (previous: FormState, data: FormData) => {
    const result = await requestNailsCodeAction(previous, data);
    if (result?.ok && result.message) onSent(result.message);
    return result;
  }, undefined);
  const [email, setEmail] = useState("");
  return <form action={action} className="space-y-5">
    <div className="space-y-2">
      <Label htmlFor="login-email">{t("email")}</Label>
      <Input id="login-email" name="email" type="email" autoComplete="email" autoCapitalize="none" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={254} placeholder="you@example.com" className="h-12 text-base" />
    </div>
    {state?.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
    <Button type="submit" className="h-12 w-full" disabled={pending}>{t(pending ? "working" : "sendCode")}</Button>
  </form>;
}

export function NailsLoginForm({ next }: { next: string }) {
  const t = useTranslations("nails");
  const [email, setEmail] = useState<string | null>(null);
  return <div className="space-y-6">
    {email ? <CodeForm email={email} next={next} onChangeEmail={() => setEmail(null)} /> : <EmailForm onSent={setEmail} />}
    <Link className="flex min-h-11 items-center justify-center text-sm text-muted-foreground underline underline-offset-4" href={`/login?next=${encodeURIComponent(next)}`}>{t("passwordLogin")}</Link>
  </div>;
}
