"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { adminSetTemplateStatusAction } from "@/lib/actions/admin-templates";

export function ToggleTemplateStatusButton({ id, status }: { id: string; status: string }) {
  const t = useTranslations("admin.aiDrafts");
  const [pending, start] = useTransition();
  const isDraft = status === "draft";
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await adminSetTemplateStatusAction(id, isDraft ? "published" : "draft").catch(() => ({ ok: false, error: t("toggleFailed") }));
          if (!res.ok) toast.error(res.error ?? t("toggleFailed"));
        })
      }
      className={`rounded-md border px-2.5 py-1 text-xs disabled:opacity-50 ${isDraft ? "border-emerald-400/40 text-emerald-400 hover:bg-emerald-400/10" : "text-destructive hover:bg-destructive/10"}`}
    >
      {t(isDraft ? "approve" : "revertToDraft")}
    </button>
  );
}
