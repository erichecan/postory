"use client";

import { useRef, type Dispatch } from "react";
import { Circle, ImagePlus, Minus, Plus, Square, Type } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { DesignElement, DesignPage } from "@/types/design";
import { newId, topZ, type EditorAction } from "./editor-state";
import { imageErrorKey, readImageFile } from "@/lib/image-file";

const ZOOMS = [0.5, 0.75, 1, 1.25, 1.5, 2];

function centered(page: DesignPage, w: number, h: number) {
  return { x: Math.round((page.width - w) / 2), y: Math.round((page.height - h) / 2), w, h, z: topZ(page), rotation: 0 };
}

export function BottomToolbar({ page, zoom, setZoom, dispatch }: { page: DesignPage; zoom: number; setZoom: (z: number) => void; dispatch: Dispatch<EditorAction> }) {
  const t = useTranslations("editor");
  const tv = useTranslations("validation");
  const fileRef = useRef<HTMLInputElement>(null);
  const unit = Math.min(page.width, page.height);
  const add = (element: DesignElement) => dispatch({ type: "add", element });
  const btn = "grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground";
  const zi = ZOOMS.indexOf(zoom);

  return (
    <div className="pointer-events-auto flex items-center gap-2">
      <div className="flex items-center gap-0.5 rounded-xl border bg-background/90 p-1 backdrop-blur">
        <button className={btn} aria-label={t("toolbar.zoomOut")} onClick={() => setZoom(ZOOMS[Math.max(0, zi - 1)])}><Minus className="size-4" /></button>
        <span className="w-12 text-center text-xs tabular-nums">{Math.round(zoom * 100)}%</span>
        <button className={btn} aria-label={t("toolbar.zoomIn")} onClick={() => setZoom(ZOOMS[Math.min(ZOOMS.length - 1, zi + 1)])}><Plus className="size-4" /></button>
      </div>
      <div className="flex items-center gap-0.5 rounded-xl border bg-background/90 p-1 backdrop-blur">
        <button
          className={btn}
          title={t("toolbar.addText")}
          onClick={() =>
            add({
              id: newId("text"),
              type: "text",
              ...centered(page, Math.round(page.width * 0.6), Math.round(unit * 0.12)),
              content: t("toolbar.defaultText"),
              style: { color: "#ffffff", fontSize: `${Math.round(unit * 0.07)}px`, minFontSize: "10", fontFamily: "Noto Sans SC", fontWeight: "700", textAlign: "center", verticalAlign: "center", textMode: "fit", lineHeight: 1.2 },
            })
          }
        >
          <Type className="size-4" />
        </button>
        <button className={btn} title={t("toolbar.addImage")} onClick={() => fileRef.current?.click()}><ImagePlus className="size-4" /></button>
        <button className={btn} title={t("toolbar.addRectangle")} onClick={() => add({ id: newId("rect"), type: "shape", shapeType: "rectangle", ...centered(page, Math.round(unit * 0.4), Math.round(unit * 0.25)), style: { fill: "#6366f1", borderRadius: "16px" } })}>
          <Square className="size-4" />
        </button>
        <button className={btn} title={t("toolbar.addCircle")} onClick={() => add({ id: newId("circle"), type: "shape", shapeType: "circle", ...centered(page, Math.round(unit * 0.3), Math.round(unit * 0.3)), style: { fill: "#f59e0b" } })}>
          <Circle className="size-4" />
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        hidden
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          try {
            const src = await readImageFile(file);
            add({ id: newId("img"), type: "image", ...centered(page, Math.round(unit * 0.4), Math.round(unit * 0.4)), content: src, style: { objectFit: "cover", borderRadius: "12px" } });
          } catch (err) {
            toast.error(tv(imageErrorKey(err)));
          }
        }}
      />
    </div>
  );
}
