"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { deleteDesignAction } from "@/lib/actions/designs";

export function DeleteDesignButton({ id }: { id: string }) {
  const t = useTranslations("designs.delete");
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        confirm(t("confirm")) &&
        start(async () => {
          const res = await deleteDesignAction(id);
          if (!res.ok) toast.error(t("failed"));
        })
      }
      className="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
      aria-label={t("label")}
    >
      <Trash2 className="size-3.5" />
    </button>
  );
}
