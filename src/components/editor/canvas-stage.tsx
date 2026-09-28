"use client";

import { useEffect, useRef, useState, type Dispatch, type PointerEvent as ReactPointerEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { PageView } from "@/components/canvas/page-view";
import type { DesignElement, DesignPage } from "@/types/design";
import type { EditorAction } from "./editor-state";

type Corner = "nw" | "ne" | "sw" | "se";
type Gesture = { id: string; mode: "move" | Corner; startX: number; startY: number; origin: DesignElement; key: string };

const MIN_SIZE = 12;
const CORNERS: Corner[] = ["nw", "ne", "sw", "se"];

function resize(origin: DesignElement, corner: Corner, dx: number, dy: number) {
  let { x, y, w, h } = origin;
  if (corner.includes("e")) w = Math.max(MIN_SIZE, origin.w + dx);
  if (corner.includes("s")) h = Math.max(MIN_SIZE, origin.h + dy);
  if (corner.includes("w")) {
    w = Math.max(MIN_SIZE, origin.w - dx);
    x = origin.x + origin.w - w;
  }
  if (corner.includes("n")) {
    h = Math.max(MIN_SIZE, origin.h - dy);
    y = origin.y + origin.h - h;
  }
  return { x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) };
}

export function CanvasStage({
  page,
  pageIndex,
  pageCount,
  selectedId,
  zoom,
  dispatch,
  onEditText,
}: {
  page: DesignPage;
  pageIndex: number;
  pageCount: number;
  selectedId: string | null;
  zoom: number;
  dispatch: Dispatch<EditorAction>;
  onEditText: () => void;
}) {
  const t = useTranslations("editor.canvas");
  const wrapRef = useRef<HTMLDivElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const [fit, setFit] = useState(0.5);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setFit(Math.min((width - 140) / page.width, (height - 170) / page.height));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [page.width, page.height]);

  const scale = Math.max(0.05, fit * zoom);

  function begin(e: ReactPointerEvent, el: DesignElement, mode: Gesture["mode"]) {
    e.stopPropagation();
    dispatch({ type: "select", id: el.id });
    if (el.locked) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    gesture.current = { id: el.id, mode, startX: e.clientX, startY: e.clientY, origin: el, key: `${mode}-${el.id}-${e.timeStamp}` };
  }

  function move(e: ReactPointerEvent) {
    const g = gesture.current;
    if (!g) return;
    const dx = (e.clientX - g.startX) / scale;
    const dy = (e.clientY - g.startY) / scale;
    const patch =
      g.mode === "move" ? { x: Math.round(g.origin.x + dx), y: Math.round(g.origin.y + dy) } : resize(g.origin, g.mode, dx, dy);
    dispatch({ type: "updateElement", id: g.id, patch, key: g.key });
  }

  function end() {
    gesture.current = null;
  }

  const hittable = [...page.elements].filter((el) => !el.hidden).sort((a, b) => a.z - b.z);
  const handle = 10 / scale;

  return (
    <div
      ref={wrapRef}
      className="relative flex min-h-0 flex-1 items-center justify-center overflow-auto bg-[radial-gradient(circle,rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:18px_18px]"
      onPointerDown={() => dispatch({ type: "select", id: null })}
    >
      {pageCount > 1 && (
        <>
          <button onClick={() => dispatch({ type: "page", index: pageIndex - 1 })} disabled={pageIndex === 0} aria-label={t("prevPage")} className="absolute left-5 top-1/2 z-10 grid size-9 -translate-y-1/2 place-items-center rounded-full border bg-background/80 disabled:opacity-30">
            <ChevronLeft className="size-4" />
          </button>
          <button onClick={() => dispatch({ type: "page", index: pageIndex + 1 })} disabled={pageIndex === pageCount - 1} aria-label={t("nextPage")} className="absolute right-5 top-1/2 z-10 grid size-9 -translate-y-1/2 place-items-center rounded-full border bg-background/80 disabled:opacity-30">
            <ChevronRight className="size-4" />
          </button>
        </>
      )}
      <div className="mb-16 shrink-0 shadow-2xl shadow-black/50" style={{ width: page.width * scale, height: page.height * scale }}>
        <div className="relative" style={{ width: page.width, height: page.height, transform: `scale(${scale})`, transformOrigin: "top left" }}>
          <PageView page={page} />
          <div className="absolute inset-0" onPointerMove={move} onPointerUp={end} onPointerCancel={end}>
            {hittable.map((el) => {
              const selected = el.id === selectedId;
              return (
                <div
                  key={el.id}
                  data-el={el.id}
                  onPointerDown={(e) => begin(e, el, "move")}
                  onDoubleClick={() => el.type === "text" && onEditText()}
                  className={selected ? "" : "hover:outline-dashed hover:outline-sky-400"}
                  style={{
                    position: "absolute",
                    left: el.x,
                    top: el.y,
                    width: el.w,
                    height: Math.max(el.h, 4),
                    zIndex: el.z,
                    transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
                    outline: selected ? `${2 / scale}px solid #6366f1` : undefined,
                    outlineWidth: selected ? undefined : 1 / scale,
                    cursor: el.locked ? "default" : "move",
                    pointerEvents: el.locked && !selected ? "none" : "auto",
                  }}
                >
                  {selected &&
                    !el.locked &&
                    CORNERS.map((c) => (
                      <span
                        key={c}
                        onPointerDown={(e) => begin(e, el, c)}
                        style={{
                          position: "absolute",
                          width: handle,
                          height: handle,
                          left: c.includes("w") ? -handle / 2 : undefined,
                          right: c.includes("e") ? -handle / 2 : undefined,
                          top: c.includes("n") ? -handle / 2 : undefined,
                          bottom: c.includes("s") ? -handle / 2 : undefined,
                          background: "#fff",
                          border: `${1.5 / scale}px solid #6366f1`,
                          borderRadius: 2 / scale,
                          cursor: c === "nw" || c === "se" ? "nwse-resize" : "nesw-resize",
                        }}
                      />
                    ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
