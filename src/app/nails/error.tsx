"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export default function NailsError({ reset }: { reset: () => void }) {
  const t = useTranslations("nails");
  return <main className="nails-main space-y-5" role="alert">
    <h1 className="text-xl font-semibold">{t("errorTitle")}</h1>
    <p className="text-sm text-muted-foreground">{t("errorDescription")}</p>
    <Button onClick={reset} className="min-h-11">{t("retry")}</Button>
    <Link href="/nails/login" className="block py-3 text-sm text-primary underline">{t("backLogin")}</Link>
  </main>;
}
