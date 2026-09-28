"use client";

import type { Dispatch } from "react";
import { useTranslations } from "next-intl";
import { ScaledPage } from "@/components/canvas/page-view";
import { cn } from "@/lib/utils";
import type { DesignPage } from "@/types/design";
import type { EditorAction } from "./editor-state";

export function PagesPanel({ pages, pageIndex, dispatch }: { pages: DesignPage[]; pageIndex: number; dispatch: Dispatch<EditorAction> }) {
  const t = useTranslations("editor.pages");
  return (
    <div className="flex flex-col gap-2 p-3">
      <p className="px-1 text-xs text-muted-foreground">{t("count", { count: pages.length })}</p>
      {pages.map((p, i) => (
        <button
          key={`${p.name}-${i}`}
          onClick={() => dispatch({ type: "page", index: i })}
          className={cn("flex items-center gap-3 rounded-lg border border-transparent p-2 text-left hover:bg-accent", i === pageIndex && "border-primary/60 bg-accent")}
        >
          <div className="pointer-events-none shrink-0 overflow-hidden rounded">
            <ScaledPage page={p} width={44} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium">{p.name}</p>
            <p className="text-[11px] text-muted-foreground">{p.width} × {p.height}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
