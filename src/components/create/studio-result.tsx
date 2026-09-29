"use client";

import { useState } from "react";
import { Download, Loader2, PenLine, Wand2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CHARGE_CREDITS } from "@/lib/billing/plan-math";
import { cn } from "@/lib/utils";
import { RATIOS, type Quality, type RatioId, type Round } from "./studio-options";

export function StudioResult({
  rounds,
  activeId,
  onSelect,
  busy,
  ratio,
  quality,
  onRefine,
  onToEditor,
}: {
  rounds: Round[];
  activeId: string | null;
  onSelect: (id: string) => void;
  busy: boolean;
  ratio: RatioId;
  quality: Quality;
  onRefine: (text: string) => void;
  onToEditor: (round: Round) => void;
}) {
  const t = useTranslations("create.result");
  const [text, setText] = useState("");
  const active = rounds.find((r) => r.id === activeId) ?? rounds.at(-1) ?? null;
  const shape = RATIOS.find((r) => r.id === (active?.ratio ?? ratio)) ?? RATIOS[0];
  const cost = CHARGE_CREDITS[quality === "hd" ? "AI_HD" : "AI_STANDARD"];

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="grid min-h-[420px] place-items-center rounded-xl border bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.04),transparent_70%)] p-4">
        <div className="relative w-full max-w-[520px] overflow-hidden rounded-lg bg-muted/40" style={{ aspectRatio: `${shape.w} / ${shape.h}`, maxHeight: 560 }}>
          {active ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={active.url} alt={active.prompt} className="absolute inset-0 size-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center">
              <Wand2 className="size-7 text-muted-foreground" />
              <p className="font-medium">{t("emptyTitle")}</p>
              <p className="max-w-64 text-xs text-muted-foreground">{t("emptyBody")}</p>
            </div>
          )}
          {busy && (
            <div className="absolute inset-0 grid place-items-center bg-background/60 backdrop-blur-sm">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          )}
        </div>
      </div>

      {rounds.length > 0 && (
        <>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {rounds.map((r, i) => (
              <button key={r.id} type="button" onClick={() => onSelect(r.id)} className={cn("flex shrink-0 flex-col items-center gap-1 text-[11px] text-muted-foreground", r.id === active?.id && "text-foreground")}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.url} alt="" className={cn("size-16 rounded-md border object-cover", r.id === active?.id && "border-primary ring-2 ring-primary/40")} />
                {t("round", { n: i + 1 })}
              </button>
            ))}
          </div>

          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              if (!text.trim()) return;
              onRefine(text.trim());
              setText("");
            }}
          >
            <Input value={text} onChange={(e) => setText(e.target.value.slice(0, 300))} placeholder={t("refinePlaceholder")} aria-label={t("refineLabel")} className="h-10 flex-1" />
            <Button type="submit" size="lg" className="h-10 gap-1.5" disabled={busy || !text.trim()}>
              <Wand2 className="size-4" /> {t("refine", { count: cost })}
            </Button>
          </form>

          {active && (
            <div className="flex flex-wrap gap-2">
              <a href={active.url} download className="inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm hover:bg-muted">
                <Download className="size-4" /> {t("download")}
              </a>
              <Button variant="outline" size="lg" className="gap-1.5" onClick={() => onToEditor(active)}>
                <PenLine className="size-4" /> {t("toEditor")}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
