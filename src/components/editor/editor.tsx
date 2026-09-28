"use client";

import { useRouter } from "next/navigation";
import { useReducer, useRef, useState } from "react";
import { toast } from "sonner";
import { PageView } from "@/components/canvas/page-view";
import { cn } from "@/lib/utils";
import type { DesignPage } from "@/types/design";
import { BottomToolbar } from "./bottom-toolbar";
import { BrandPanel, type BrandFields } from "./brand-panel";
import { CanvasStage } from "./canvas-stage";
import { currentPage, editorReducer, initEditor, selectedElement } from "./editor-state";
import { EditorTopbar } from "./editor-topbar";
import { exportNodeAsPng } from "./export-page";
import { LayersPanel } from "./layers-panel";
import { PagesPanel } from "./pages-panel";
import { PublishDialog } from "./publish-dialog";
import { StylePanel } from "./style-panel";
import { useAutosave } from "./use-autosave";
import { useShortcuts } from "./use-shortcuts";

const TABS = [
  { id: "pages", label: "页面" },
  { id: "style", label: "样式" },
  { id: "layers", label: "图层" },
  { id: "brand", label: "商家资料" },
] as const;
type Tab = (typeof TABS)[number]["id"];

export type EditorDesign = { id: string; title: string; pages: DesignPage[]; platforms: string[]; scheduledAt: string | null };

export function Editor({ design, brand }: { design: EditorDesign; brand: BrandFields | null }) {
  const [state, dispatch] = useReducer(editorReducer, design.pages, initEditor);
  const [title, setTitle] = useState(design.title);
  const [titleEdits, setTitleEdits] = useState(0);
  const [tab, setTab] = useState<Tab>("style");
  const [zoom, setZoom] = useState(1);
  const [exporting, setExporting] = useState(false);
  const router = useRouter();
  const exportRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const page = currentPage(state);
  const selected = selectedElement(state);
  const { status, flush } = useAutosave(design.id, title.trim() || "未命名作品", state.pages, state.dirty + titleEdits);
  useShortcuts(selected, dispatch);

  async function handleExport() {
    if (!exportRef.current) return;
    setExporting(true);
    try {
      const suffix = state.pages.length > 1 ? `-${page.name}` : "";
      await exportNodeAsPng(exportRef.current, `${title || "作品"}${suffix}.png`);
    } catch {
      toast.error("导出失败，请重试");
    } finally {
      setExporting(false);
    }
  }

  function editText() {
    setTab("style");
    requestAnimationFrame(() => textRef.current?.focus());
  }

  return (
    <div className="flex h-dvh flex-col bg-[#0f1013] text-foreground">
      <EditorTopbar
        title={title}
        onTitle={(v) => {
          setTitle(v);
          setTitleEdits((n) => n + 1);
        }}
        onBack={async () => {
          if ((await flush()) || confirm("还有改动没保存成功，确定离开吗？")) router.push("/designs");
        }}
        status={status}
        canUndo={state.past.length > 0}
        canRedo={state.future.length > 0}
        onUndo={() => dispatch({ type: "undo" })}
        onRedo={() => dispatch({ type: "redo" })}
        onExport={handleExport}
        exporting={exporting}
        publish={<PublishDialog designId={design.id} initialPlatforms={design.platforms} initialAt={design.scheduledAt ? new Date(design.scheduledAt) : null} beforeSubmit={flush} />}
      />
      <div className="flex min-h-0 flex-1">
        <div className="relative flex min-w-0 flex-1 flex-col">
          <CanvasStage page={page} pageIndex={state.pageIndex} pageCount={state.pages.length} selectedId={state.selectedId} zoom={zoom} dispatch={dispatch} onEditText={editText} />
          <div className="pointer-events-none absolute inset-x-0 bottom-5 flex justify-center">
            <BottomToolbar page={page} zoom={zoom} setZoom={setZoom} dispatch={dispatch} />
          </div>
        </div>
        <aside className="flex w-[300px] shrink-0 flex-col border-l bg-[#141519]">
          <div className="flex gap-1 border-b p-2">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} className={cn("h-8 flex-1 rounded-md text-xs text-muted-foreground hover:text-foreground", tab === t.id && "bg-accent text-foreground")}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {tab === "pages" && <PagesPanel pages={state.pages} pageIndex={state.pageIndex} dispatch={dispatch} />}
            {tab === "style" && <StylePanel ref={textRef} page={page} el={selected} dispatch={dispatch} />}
            {tab === "layers" && <LayersPanel page={page} selectedId={state.selectedId} dispatch={dispatch} />}
            {tab === "brand" && <BrandPanel brand={brand} page={page} selected={selected} dispatch={dispatch} />}
          </div>
        </aside>
      </div>
      <div aria-hidden className="pointer-events-none fixed left-[-100000px] top-0">
        <PageView ref={exportRef} page={page} />
      </div>
    </div>
  );
}
