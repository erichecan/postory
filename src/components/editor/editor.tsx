"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useReducer, useRef, useState } from "react";
import { toast } from "sonner";
import { InsufficientDialog } from "@/components/billing/insufficient-dialog";
import { TopupDialog } from "@/components/billing/topup-dialog";
import { PageView } from "@/components/canvas/page-view";
import { chargeDesignAction } from "@/lib/actions/billing";
import type { Currency } from "@/types/commerce";
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

const TABS = ["pages", "style", "layers", "brand"] as const;
type Tab = (typeof TABS)[number];

export type EditorDesign = { id: string; title: string; pages: DesignPage[]; platforms: string[]; scheduledAt: string | null };
export type EditorBilling = { hasPlan: boolean; allowedPlatforms: string[]; topup: { currency: Currency; unitPrice: number } | null; canClaimGift: boolean };

export function Editor({ design, brand, billing }: { design: EditorDesign; brand: BrandFields | null; billing: EditorBilling }) {
  const [state, dispatch] = useReducer(editorReducer, design.pages, initEditor);
  const [title, setTitle] = useState(design.title);
  const [titleEdits, setTitleEdits] = useState(0);
  const [tab, setTab] = useState<Tab>("style");
  const [zoom, setZoom] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [short, setShort] = useState<{ need: number; have: number } | null>(null);
  const [topupOpen, setTopupOpen] = useState(false);
  const router = useRouter();
  const t = useTranslations("editor");
  const exportRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const page = currentPage(state);
  const selected = selectedElement(state);
  const { status, flush } = useAutosave(design.id, title.trim() || t("untitled"), state.pages, state.dirty + titleEdits);
  useShortcuts(selected, dispatch);

  async function handleExport() {
    if (!exportRef.current) return;
    setExporting(true);
    try {
      await flush();
      const charge = await chargeDesignAction(design.id);
      if (!charge.ok) {
        if (charge.reason === "insufficient") setShort({ need: charge.need, have: charge.have });
        else toast.error(t("exportFailed"));
        return;
      }
      const suffix = state.pages.length > 1 ? `-${page.name}` : "";
      await exportNodeAsPng(exportRef.current, page, `${title || t("exportFileName")}${suffix}.png`);
      toast.success(t(charge.duplicate ? "charge.exportedFree" : "charge.exported"));
    } catch {
      toast.error(t("exportFailed"));
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
          if ((await flush()) || confirm(t("leaveUnsaved"))) router.push("/designs");
        }}
        status={status}
        canUndo={state.past.length > 0}
        canRedo={state.future.length > 0}
        onUndo={() => dispatch({ type: "undo" })}
        onRedo={() => dispatch({ type: "redo" })}
        onExport={handleExport}
        exporting={exporting}
        publish={
          <PublishDialog
            designId={design.id}
            initialPlatforms={design.platforms.filter((p) => billing.allowedPlatforms.includes(p))}
            initialAt={design.scheduledAt ? new Date(design.scheduledAt) : null}
            beforeSubmit={flush}
            hasPlan={billing.hasPlan}
            allowedPlatforms={billing.allowedPlatforms}
            onInsufficient={(need, have) => setShort({ need, have })}
          />
        }
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
            {TABS.map((id) => (
              <button key={id} onClick={() => setTab(id)} className={cn("h-8 flex-1 rounded-md text-xs text-muted-foreground hover:text-foreground", tab === id && "bg-accent text-foreground")}>
                {t(`tabs.${id}`)}
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
      <InsufficientDialog
        open={short !== null}
        onOpenChange={(o) => !o && setShort(null)}
        need={short?.need ?? 1}
        have={short?.have ?? 0}
        hasPlan={billing.topup !== null}
        templateOnlyExcluded={false}
        canClaimGift={billing.canClaimGift}
        onTopup={() => {
          setShort(null);
          setTopupOpen(true);
        }}
      />
      {billing.topup && (
        <TopupDialog
          open={topupOpen}
          onOpenChange={setTopupOpen}
          currency={billing.topup.currency}
          unitPrice={billing.topup.unitPrice}
          onSubmit={() => {
            setTopupOpen(false);
            router.push("/membership");
          }}
        />
      )}
      <div aria-hidden className="pointer-events-none fixed left-[-100000px] top-0">
        <PageView ref={exportRef} page={page} />
      </div>
    </div>
  );
}
