"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { adminToggleUserAction } from "@/lib/actions/admin";

export function ToggleUserButton({ id, disabled }: { id: string; disabled: boolean }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          try {
            await adminToggleUserAction(id, !disabled);
          } catch {
            toast.error("操作失败");
          }
        })
      }
      className={`rounded-md border px-2.5 py-1 text-xs disabled:opacity-50 ${disabled ? "hover:bg-accent" : "text-destructive hover:bg-destructive/10"}`}
    >
      {disabled ? "恢复" : "停用"}
    </button>
  );
}
