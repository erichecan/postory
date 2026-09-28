"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteDesignAction } from "@/lib/actions/designs";

export function DeleteDesignButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        confirm("确定删除这个作品吗？删除后无法恢复。") &&
        start(async () => {
          const res = await deleteDesignAction(id);
          if (!res.ok) toast.error("删除失败，作品可能已不存在");
        })
      }
      className="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
      aria-label="删除作品"
    >
      <Trash2 className="size-3.5" />
    </button>
  );
}
