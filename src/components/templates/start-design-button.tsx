"use client";

import { useTransition } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { startDesignAction } from "@/lib/actions/designs";

export function StartDesignButton({ templateId }: { templateId: string }) {
  const t = useTranslations("templates");
  const [pending, start] = useTransition();
  return (
    <button
      onClick={() => start(() => startDesignAction(templateId))}
      disabled={pending}
      className="inline-flex h-11 items-center gap-2 rounded-lg bg-white px-6 text-sm font-medium text-black transition hover:bg-white/90 disabled:opacity-60"
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : null}
      {t("startDesign")}
      <ArrowRight className="size-4" />
    </button>
  );
}
