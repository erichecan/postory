"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { deleteCustomerAction } from "@/lib/actions/customers";

export function DeleteCustomerButton({ id }: { id: string }) {
  const t = useTranslations("customers");
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!window.confirm(t("deleteConfirm"))) return;
        start(async () => {
          const res = await deleteCustomerAction(id).catch(() => ({ ok: false }));
          if (!res.ok) toast.error(t("deleteFailed"));
        });
      }}
      className="rounded-md border px-2.5 py-1 text-xs text-destructive hover:bg-destructive/10 disabled:opacity-50"
    >
      {t("delete")}
    </button>
  );
}
