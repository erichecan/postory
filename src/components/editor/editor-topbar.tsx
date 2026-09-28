"use client";

import { ArrowLeft, Check, CloudOff, Download, Loader2, Redo2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SaveStatus } from "./use-autosave";

const STATUS: Record<SaveStatus, { text: string; icon: React.ReactNode }> = {
  saved: { text: "已保存", icon: <Check className="size-3.5" /> },
  pending: { text: "有改动", icon: null },
  saving: { text: "保存中", icon: <Loader2 className="size-3.5 animate-spin" /> },
  error: { text: "保存失败，稍后重试", icon: <CloudOff className="size-3.5" /> },
};

export function EditorTopbar({
  title,
  onTitle,
  onBack,
  status,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onExport,
  exporting,
  publish,
}: {
  title: string;
  onTitle: (v: string) => void;
  onBack: () => void;
  status: SaveStatus;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onExport: () => void;
  exporting: boolean;
  publish: React.ReactNode;
}) {
  const s = STATUS[status];
  const iconBtn = "grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-30";
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b px-3">
      <button type="button" onClick={onBack} className={iconBtn} title="返回我的作品">
        <ArrowLeft className="size-4" />
      </button>
      <input
        value={title}
        onChange={(e) => onTitle(e.target.value.slice(0, 128))}
        className="h-8 min-w-0 max-w-md flex-1 truncate rounded-md border border-transparent bg-transparent px-2 text-sm font-medium outline-none hover:border-border focus:border-ring"
      />
      <span className={`hidden items-center gap-1 text-xs sm:flex ${status === "error" ? "text-destructive" : "text-muted-foreground"}`}>
        {s.icon}
        {s.text}
      </span>
      <div className="ml-auto flex items-center gap-1">
        <button className={iconBtn} onClick={onUndo} disabled={!canUndo} title="撤销 (⌘Z)"><Undo2 className="size-4" /></button>
        <button className={iconBtn} onClick={onRedo} disabled={!canRedo} title="重做 (⇧⌘Z)"><Redo2 className="size-4" /></button>
        <Button variant="outline" size="sm" className="ml-2 h-8 gap-1.5" onClick={onExport} disabled={exporting}>
          {exporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
          导出 PNG
        </Button>
        {publish}
      </div>
    </header>
  );
}
