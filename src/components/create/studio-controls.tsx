"use client";

import { useRef } from "react";
import { ImagePlus, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CHARGE_CREDITS } from "@/lib/billing/plan-math";
import { cn } from "@/lib/utils";
import { RATIOS, SCENES, UPLOAD_MAX_BYTES, UPLOAD_TYPES, type Quality, type RatioId, type SceneId, type StudioMode } from "./studio-options";

export type ControlsState = {
  mode: StudioMode;
  photo: string | null;
  scene: SceneId | null;
  prompt: string;
  useBrand: boolean;
  ratio: RatioId;
  quality: Quality;
};

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={cn("h-8 rounded-lg border px-2.5 text-xs transition-colors", on ? "border-primary bg-primary/15 text-foreground" : "text-foreground/75 hover:text-foreground")}>
      {children}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

export function StudioControls({
  state,
  onChange,
  shopName,
  balance,
  busy,
  disabledReason,
  onGenerate,
  onUploadError,
}: {
  state: ControlsState;
  onChange: (patch: Partial<ControlsState>) => void;
  shopName: string | null;
  balance: number;
  busy: boolean;
  disabledReason: string | null;
  onGenerate: () => void;
  onUploadError: (message: string) => void;
}) {
  const t = useTranslations("create");
  const fileRef = useRef<HTMLInputElement>(null);
  const cost = CHARGE_CREDITS[state.quality === "hd" ? "AI_HD" : "AI_STANDARD"];
  const ready = state.mode === "text" ? state.prompt.trim().length > 0 || state.scene !== null : state.photo !== null;

  function pickFile(file: File | undefined) {
    if (!file) return;
    if (!(UPLOAD_TYPES as readonly string[]).includes(file.type)) return onUploadError(t("upload.badType"));
    if (file.size > UPLOAD_MAX_BYTES) return onUploadError(t("upload.tooLarge"));
    onChange({ photo: URL.createObjectURL(file) });
  }

  return (
    <div className="flex flex-col gap-5 self-start rounded-xl border bg-card p-4">
      <div className="grid grid-cols-2 rounded-lg bg-muted p-[3px]">
        {(["photo", "text"] as const).map((m) => (
          <button key={m} type="button" onClick={() => onChange({ mode: m })} className={cn("h-8 rounded-md text-sm font-medium", state.mode === m ? "bg-background text-foreground shadow-sm dark:bg-input/40" : "text-muted-foreground")}>
            {t(`mode.${m}`)}
          </button>
        ))}
      </div>

      {state.mode === "photo" && (
        <Field label={t("upload.label")}>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              pickFile(e.dataTransfer.files[0]);
            }}
            className="relative grid aspect-[4/3] place-items-center overflow-hidden rounded-lg border border-dashed bg-input/20 text-center hover:border-primary/60"
          >
            {state.photo ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={state.photo} alt="" className="absolute inset-0 size-full object-cover" />
                <span className="absolute right-2 bottom-2 rounded-md bg-black/60 px-2 py-1 text-xs text-white">{t("upload.replace")}</span>
              </>
            ) : (
              <span className="flex flex-col items-center gap-2 px-6 text-xs text-muted-foreground">
                <ImagePlus className="size-6" />
                {t("upload.hint")}
              </span>
            )}
          </button>
          <input ref={fileRef} type="file" accept={UPLOAD_TYPES.join(",")} className="hidden" onChange={(e) => pickFile(e.target.files?.[0])} />
        </Field>
      )}

      <Field label={t("scenes.label")}>
        <div className="flex flex-wrap gap-1.5">
          {SCENES.map((s) => (
            <Chip key={s} on={state.scene === s} onClick={() => onChange({ scene: state.scene === s ? null : s })}>{t(`scenes.${s}`)}</Chip>
          ))}
        </div>
      </Field>

      <Field label={t("prompt.label")}>
        <Textarea
          value={state.prompt}
          onChange={(e) => onChange({ prompt: e.target.value.slice(0, 500) })}
          placeholder={t(state.mode === "photo" ? "prompt.photoPlaceholder" : "prompt.textPlaceholder")}
          className="min-h-20 text-sm"
        />
      </Field>

      <label className="flex items-start gap-2.5 text-sm">
        <input type="checkbox" checked={state.useBrand} disabled={!shopName} onChange={(e) => onChange({ useBrand: e.target.checked })} className="mt-0.5 size-4 accent-[var(--primary)]" />
        <span className="flex flex-col">
          {t("brand.label")}
          <span className="text-xs text-muted-foreground">{shopName ? t("brand.hint", { shop: shopName }) : t("brand.missing")}</span>
        </span>
      </label>

      <Field label={t("ratio.label")}>
        <div className="grid grid-cols-2 gap-1.5">
          {RATIOS.map((r) => (
            <Chip key={r.id} on={state.ratio === r.id} onClick={() => onChange({ ratio: r.id })}>{t(`ratio.${r.id}`)}</Chip>
          ))}
        </div>
      </Field>

      <Field label={t("quality.label")}>
        <div className="grid grid-cols-2 gap-1.5">
          {(["standard", "hd"] as const).map((q) => (
            <Chip key={q} on={state.quality === q} onClick={() => onChange({ quality: q })}>
              {t(`quality.${q}`)} · {CHARGE_CREDITS[q === "hd" ? "AI_HD" : "AI_STANDARD"]} credit
            </Chip>
          ))}
        </div>
      </Field>

      <div className="flex flex-col gap-2 border-t pt-4">
        <Button size="lg" className="h-10 gap-2" onClick={onGenerate} disabled={busy || !ready || disabledReason !== null}>
          <Sparkles className="size-4" /> {busy ? t("generating") : t("generate", { count: cost })}
        </Button>
        <span className="text-center text-xs text-muted-foreground">{disabledReason ?? t("balance", { count: balance })}</span>
      </div>
    </div>
  );
}
