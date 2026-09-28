"use client";

import { forwardRef, type Dispatch } from "react";
import { AlignCenter, AlignLeft, AlignRight, ArrowDown, ArrowUp, Lock, Trash2 } from "lucide-react";
import type { DesignElement, DesignPage } from "@/types/design";
import type { EditorAction } from "./editor-state";
import { ColorField, NumberField, Section, Segmented } from "./fields";
import { ImageReplace } from "./image-replace";

export const FONT_OPTIONS = ["Noto Sans SC", "Inter", "Anton", "Archivo Black", "Fraunces", "Space Grotesk", "Syne"];
const WEIGHTS = ["400", "500", "600", "700", "800", "900"];
const selectCls = "h-8 w-full rounded-md border bg-input/30 px-2 text-xs outline-none focus:border-ring";

export const StylePanel = forwardRef<HTMLTextAreaElement, { page: DesignPage; el: DesignElement | null; dispatch: Dispatch<EditorAction> }>(
  function StylePanel({ page, el, dispatch }, textRef) {
    if (!el) {
      return (
        <>
          <Section title="画布尺寸">
            <div className="grid grid-cols-2 gap-2">
              <NumberField label="W" value={page.width} readOnly onChange={() => {}} />
              <NumberField label="H" value={page.height} readOnly onChange={() => {}} />
            </div>
          </Section>
          <Section title="背景">
            <ColorField label="颜色" value={page.background} onChange={(v) => dispatch({ type: "updatePage", patch: { background: v }, key: "bg" })} />
          </Section>
          <p className="px-4 py-4 text-xs leading-relaxed text-muted-foreground">点击画布上的文字、图片或色块，就能在这里修改它的样式。</p>
        </>
      );
    }

    const style = (patch: DesignElement["style"], key: string) => dispatch({ type: "updateStyle", id: el.id, patch, key: `${key}-${el.id}` });
    const set = (patch: Partial<DesignElement>, key: string) => dispatch({ type: "updateElement", id: el.id, patch, key: `${key}-${el.id}` });
    const st = el.style;

    return (
      <>
        {el.locked && (
          <p className="flex items-center gap-2 border-b px-4 py-3 text-xs text-muted-foreground">
            <Lock className="size-3.5" /> 模板底图已锁定。可以在上面添加文字和图片。
          </p>
        )}
        {el.type === "text" && (
          <Section title="文字内容">
            <textarea
              ref={textRef}
              value={el.content ?? ""}
              onChange={(e) => set({ content: e.target.value }, "content")}
              rows={3}
              className="w-full resize-y rounded-md border bg-input/30 px-2.5 py-2 text-sm outline-none focus:border-ring"
            />
          </Section>
        )}
        {el.type === "text" && (
          <Section title="字体">
            <select value={st.fontFamily ?? "Inter"} onChange={(e) => style({ fontFamily: e.target.value }, "ff")} className={selectCls}>
              {[...new Set([st.fontFamily ?? "Inter", ...FONT_OPTIONS])].map((f) => (
                <option key={f} value={f}>{f === "Noto Sans SC" ? "思源黑体（中文）" : f}</option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <NumberField label="字" value={parseFloat(st.fontSize ?? "32")} min={4} onChange={(v) => style({ fontSize: `${v}px`, minFontSize: String(Math.min(v, parseFloat(st.minFontSize ?? "8"))) }, "fs")} suffix="px" />
              <select value={st.fontWeight ?? "400"} onChange={(e) => style({ fontWeight: e.target.value }, "fw")} className={selectCls}>
                {WEIGHTS.map((w) => <option key={w} value={w}>字重 {w}</option>)}
              </select>
            </div>
            <ColorField label="颜色" value={st.color} onChange={(v) => style({ color: v }, "color")} />
            <Segmented
              value={st.textAlign ?? "left"}
              onChange={(v) => style({ textAlign: v }, "align")}
              options={[
                { value: "left", label: <AlignLeft className="size-3.5" /> },
                { value: "center", label: <AlignCenter className="size-3.5" /> },
                { value: "right", label: <AlignRight className="size-3.5" /> },
              ]}
            />
          </Section>
        )}
        {el.type === "shape" && (
          <Section title="填充">
            <ColorField label="颜色" value={st.fill} onChange={(v) => style({ fill: v }, "fill")} />
            {el.shapeType !== "circle" && (
              <NumberField label="R" value={parseFloat(st.borderRadius ?? "0")} min={0} onChange={(v) => style({ borderRadius: `${v}px` }, "radius")} suffix="圆角" />
            )}
          </Section>
        )}
        {el.type === "image" && !el.locked && (
          <Section title="图片">
            <ImageReplace onPick={(src) => set({ content: src }, "img")} />
            <Segmented value={st.objectFit ?? "cover"} onChange={(v) => style({ objectFit: v }, "fit")} options={[{ value: "cover", label: "填满" }, { value: "contain", label: "完整显示" }]} />
          </Section>
        )}
        {!el.locked && (
          <Section title="位置与尺寸">
            <div className="grid grid-cols-2 gap-2">
              <NumberField label="X" value={el.x} onChange={(v) => set({ x: v }, "x")} />
              <NumberField label="Y" value={el.y} onChange={(v) => set({ y: v }, "y")} />
              <NumberField label="W" value={el.w} min={1} onChange={(v) => set({ w: v }, "w")} />
              <NumberField label="H" value={el.h} min={1} onChange={(v) => set({ h: v }, "h")} />
              <NumberField label="°" value={el.rotation} onChange={(v) => set({ rotation: v }, "rot")} />
              <NumberField label="α" value={Math.round((st.opacity ?? 1) * 100)} min={0} onChange={(v) => style({ opacity: Math.min(100, Math.max(0, v)) / 100 }, "op")} suffix="%" />
            </div>
          </Section>
        )}
        {!el.locked && (
          <div className="flex gap-2 px-4 py-4">
            <button onClick={() => dispatch({ type: "reorder", id: el.id, dir: "up" })} className="flex h-8 flex-1 items-center justify-center gap-1 rounded-md border text-xs hover:bg-accent"><ArrowUp className="size-3.5" />上移</button>
            <button onClick={() => dispatch({ type: "reorder", id: el.id, dir: "down" })} className="flex h-8 flex-1 items-center justify-center gap-1 rounded-md border text-xs hover:bg-accent"><ArrowDown className="size-3.5" />下移</button>
            <button onClick={() => dispatch({ type: "remove", id: el.id })} className="flex h-8 flex-1 items-center justify-center gap-1 rounded-md border text-xs text-destructive hover:bg-destructive/10"><Trash2 className="size-3.5" />删除</button>
          </div>
        )}
      </>
    );
  },
);
