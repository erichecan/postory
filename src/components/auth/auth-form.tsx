"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FormState } from "@/lib/validation";

type Mode = "login" | "register";

const SWITCH_HREF = { login: "/register", register: "/login" } as const;

export function AuthForm({
  mode,
  action,
  next,
}: {
  mode: Mode;
  action: (state: FormState, data: FormData) => Promise<FormState>;
  next?: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  return (
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold">{t(`${mode}.title`)}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t(`${mode}.subtitle`)}
        </p>
      </div>
      {next && <input type="hidden" name="next" value={next} />}
      <div className="flex flex-col gap-2">
        <Label htmlFor="phone">{t("phone")}</Label>
        <Input id="phone" name="phone" inputMode="numeric" autoComplete="tel" placeholder={t("phonePlaceholder")} required className="h-10" />
      </div>
      {mode === "register" && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">{t("shopName")}</Label>
          <Input id="name" name="name" placeholder={t("shopNamePlaceholder")} required className="h-10" />
        </div>
      )}
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">{t("password")}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          placeholder={mode === "register" ? t("passwordPlaceholder") : ""}
          required
          className="h-10"
        />
      </div>
      {state?.error && <p className="rounded-md bg-destructive/15 px-3 py-2 text-sm text-destructive">{state.error}</p>}
      <Button type="submit" size="lg" className="h-10" disabled={pending}>
        {pending ? tc("loading") : t(`${mode}.submit`)}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        {t(`${mode}.switchText`)}
        <Link href={SWITCH_HREF[mode]} className="ml-1 text-primary hover:underline">
          {t(`${mode}.switchLabel`)}
        </Link>
      </p>
    </form>
  );
}
