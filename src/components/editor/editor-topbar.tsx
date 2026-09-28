"use client";

import { ArrowLeft, Check, CloudOff, Download, Loader2, Redo2, Undo2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { SaveStatus } from "./use-autosave";

const STATUS_ICON: Record<SaveStatus, React.ReactNode> = {
  saved: <Check className="size-3.5" />,
  pending: null,
  saving: <Loader2 className="size-3.5 animate-spin" />,
  error: <CloudOff className="size-3.5" />,
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
  const t = useTranslations("editor.topbar");
  const iconBtn = "grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-30";
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b px-3">
      <button type="button" onClick={onBack} className={iconBtn} title={t("back")}>
        <ArrowLeft className="size-4" />
      </button>
      <input
        value={title}
        onChange={(e) => onTitle(e.target.value.slice(0, 128))}
        className="h-8 min-w-0 max-w-md flex-1 truncate rounded-md border border-transparent bg-transparent px-2 text-sm font-medium outline-none hover:border-border focus:border-ring"
      />
      <span className={`hidden items-center gap-1 text-xs sm:flex ${status === "error" ? "text-destructive" : "text-muted-foreground"}`}>
        {STATUS_ICON[status]}
        {t(`status.${status}`)}
      </span>
      <div className="ml-auto flex items-center gap-1">
        <button className={iconBtn} onClick={onUndo} disabled={!canUndo} title={t("undo")}><Undo2 className="size-4" /></button>
        <button className={iconBtn} onClick={onRedo} disabled={!canRedo} title={t("redo")}><Redo2 className="size-4" /></button>
        <Button variant="outline" size="sm" className="ml-2 h-8 gap-1.5" onClick={onExport} disabled={exporting}>
          {exporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
          {t("exportPng")}
        </Button>
        {publish}
      </div>
    </header>
  );
}
