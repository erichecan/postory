"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { LOCALES, type Locale } from "@/i18n/config";
import { setLocaleAction } from "@/lib/actions/locale";
import { cn } from "@/lib/utils";

const LABELS: Record<Locale, string> = { zh: "中", en: "EN" };

export function LocaleSwitcher({ className }: { className?: string }) {
  const t = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const [pending, start] = useTransition();

  const choose = (next: Locale) => {
    if (next === locale) return;
    start(async () => {
      await setLocaleAction(next);
      router.refresh();
    });
  };

  return (
    <div role="group" aria-label={t("language")} className={cn("flex items-center rounded-md border border-white/10 p-0.5 text-xs", pending && "opacity-60", className)}>
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          aria-pressed={l === locale}
          disabled={pending}
          onClick={() => choose(l)}
          className={cn("h-6 min-w-8 rounded px-1.5 transition-colors", l === locale ? "bg-white/10 text-foreground" : "text-muted-foreground hover:text-foreground")}
        >
          {LABELS[l]}
        </button>
      ))}
    </div>
  );
}
