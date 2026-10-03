"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { naturalLanguageOrderAction } from "@/lib/actions/calendar";

export function NlOrderBox() {
  const t = useTranslations("calendar");
  const router = useRouter();
  const [text, setText] = useState("");
  const [pending, start] = useTransition();

  function submit() {
    if (!text.trim()) return;
    start(async () => {
      const result = await naturalLanguageOrderAction(text);
      if (!result.ok) {
        toast.error(t("nlOrder.missingProfile"));
        return;
      }
      toast.success(t("nlOrder.success", { date: result.date }));
      setText("");
      router.refresh();
    });
  }

  return (
    <div className="mt-4 flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] p-2">
      <Sparkles className="ml-2 size-4 shrink-0 text-primary" />
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder={t("nlOrder.placeholder")}
        className="h-9 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
      <button
        type="button"
        disabled={pending}
        onClick={submit}
        className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
      >
        {pending && <Loader2 className="size-3.5 animate-spin" />}
        {t("nlOrder.submit")}
      </button>
    </div>
  );
}
