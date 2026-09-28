"use client";

import { useEffect, type Dispatch } from "react";
import type { DesignElement } from "@/types/design";
import type { EditorAction } from "./editor-state";

function typing(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable);
}

export function useShortcuts(selected: DesignElement | null, dispatch: Dispatch<EditorAction>) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "z" && !typing(e.target)) {
        e.preventDefault();
        dispatch({ type: e.shiftKey ? "redo" : "undo" });
        return;
      }
      if (typing(e.target) || !selected || selected.locked) {
        if (e.key === "Escape") dispatch({ type: "select", id: null });
        return;
      }
      const step = e.shiftKey ? 10 : 1;
      const nudge: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
      if (e.key in nudge) {
        e.preventDefault();
        const [dx, dy] = nudge[e.key];
        dispatch({ type: "updateElement", id: selected.id, patch: { x: selected.x + dx, y: selected.y + dy }, key: `nudge-${selected.id}` });
      } else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        dispatch({ type: "remove", id: selected.id });
      } else if (e.key === "Escape") {
        dispatch({ type: "select", id: null });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, dispatch]);
}
