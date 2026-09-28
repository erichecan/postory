"use client";

import type { Dispatch } from "react";
import { Circle, Eye, EyeOff, Image as ImageIcon, Lock, Square, Type } from "lucide-react";
import { useTranslations } from "next-intl";
import { plainText } from "@/components/canvas/rich-text";
import { cn } from "@/lib/utils";
import type { DesignElement, DesignPage } from "@/types/design";
import type { EditorAction } from "./editor-state";

function label(el: DesignElement, t: ReturnType<typeof useTranslations<"editor.layers">>) {
  if (el.type === "text") return plainText(el.content).trim() || t("emptyText");
  if (el.name) return el.name;
  if (el.type === "image") return t("image");
  return el.shapeType === "circle" ? t("circle") : t("rectangle");
}

function Icon({ el }: { el: DesignElement }) {
  const cls = "size-3.5 shrink-0 text-muted-foreground";
  if (el.type === "text") return <Type className={cls} />;
  if (el.type === "image") return <ImageIcon className={cls} />;
  return el.shapeType === "circle" ? <Circle className={cls} /> : <Square className={cls} />;
}

export function LayersPanel({ page, selectedId, dispatch }: { page: DesignPage; selectedId: string | null; dispatch: Dispatch<EditorAction> }) {
  const t = useTranslations("editor.layers");
  const items = [...page.elements].sort((a, b) => b.z - a.z);
  return (
    <ul className="flex flex-col p-2">
      {items.map((el) => (
        <li key={el.id}>
          <div
            role="button"
            tabIndex={0}
            onClick={() => dispatch({ type: "select", id: el.id })}
            onKeyDown={(e) => e.key === "Enter" && dispatch({ type: "select", id: el.id })}
            className={cn(
              "group flex h-8 cursor-pointer items-center gap-2.5 rounded-md px-2.5 text-xs hover:bg-accent",
              el.id === selectedId && "bg-accent",
              el.hidden && "opacity-50",
            )}
          >
            <Icon el={el} />
            <span className="min-w-0 flex-1 truncate">{label(el, t)}</span>
            {el.locked ? (
              <Lock className="size-3.5 text-muted-foreground" />
            ) : (
              <button
                type="button"
                aria-label={el.hidden ? t("show") : t("hide")}
                onClick={(e) => {
                  e.stopPropagation();
                  dispatch({ type: "updateElement", id: el.id, patch: { hidden: !el.hidden } });
                }}
                className="text-muted-foreground opacity-0 hover:text-foreground group-hover:opacity-100"
              >
                {el.hidden ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
