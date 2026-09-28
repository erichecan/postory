"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { adminToggleUserAction } from "@/lib/actions/admin";

export function ToggleUserButton({ id, disabled }: { id: string; disabled: boolean }) {
  const t = useTranslations("admin.toggle");
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await adminToggleUserAction(id, !disabled).catch(() => ({ ok: false, error: t("failed") }));
          if (!res.ok) toast.error(res.error ?? t("failed"));
        })
      }
      className={`rounded-md border px-2.5 py-1 text-xs disabled:opacity-50 ${disabled ? "hover:bg-accent" : "text-destructive hover:bg-destructive/10"}`}
    >
      {t(disabled ? "enable" : "disable")}
    </button>
  );
}
