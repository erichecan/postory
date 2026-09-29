"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { adminSaveTierAction } from "@/lib/actions/admin-billing";
import { FEATURE_IDS, type FeatureId, type FeatureValue, type TierFeatures } from "@/lib/billing/tier-features";

export type TierDraft = {
  id: string;
  nameZh: string;
  nameEn: string;
  taglineZh: string;
  taglineEn: string;
  benefitsZh: string[];
  benefitsEn: string[];
  features: TierFeatures;
  defaultMonthlyCredits: number;
  defaultMonthlyVideos: number;
  referenceFee: number;
  recommended: boolean;
  visible: boolean;
  sortOrder: number;
};

type Kind = "yes" | "no" | "custom" | "addon" | "all" | "number";
const KINDS: Kind[] = ["yes", "no", "number", "custom", "addon", "all"];

function kindOf(v: FeatureValue): Kind {
  if (v === true) return "yes";
  if (v === false) return "no";
  return typeof v === "number" ? "number" : v;
}

function fromKind(kind: Kind, prev: FeatureValue): FeatureValue {
  if (kind === "yes") return true;
  if (kind === "no") return false;
  if (kind === "number") return typeof prev === "number" ? prev : 0;
  return kind;
}

function Text({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} maxLength={64} onChange={(e) => onChange(e.target.value)} className="h-9" />
    </div>
  );
}

function Num({ id, label, value, onChange }: { id: string; label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type="number" min={0} value={value} onChange={(e) => onChange(Math.max(0, Math.round(Number(e.target.value))))} className="h-9 tabular-nums" />
    </div>
  );
}

export function TierEditor({ initial }: { initial: TierDraft }) {
  const t = useTranslations("admin.tiers");
  const tf = useTranslations("plans");
  const [d, setD] = useState(initial);
  const [pending, start] = useTransition();
  const set = (patch: Partial<TierDraft>) => setD((v) => ({ ...v, ...patch }));
  const setFeature = (fid: FeatureId, value: FeatureValue) => set({ features: { ...d.features, [fid]: value } });
  const toLines = (v: string) => v.split("\n").map((x) => x.trim()).filter(Boolean);
  const p = (k: string) => `${d.id}-${k}`;

  function save() {
    start(async () => {
      const { id, ...input } = d;
      const res = await adminSaveTierAction(id, input);
      if (res.ok) toast.success(t("saved"));
      else toast.error(res.error ?? "");
    });
  }

  return (
    <section className="flex flex-col gap-5 rounded-xl border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{d.nameZh} · {d.nameEn}</h2>
        <div className="flex items-center gap-4 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" checked={d.recommended} onChange={(e) => set({ recommended: e.target.checked })} className="size-4 accent-[var(--primary)]" />{t("recommended")}</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={d.visible} onChange={(e) => set({ visible: e.target.checked })} className="size-4 accent-[var(--primary)]" />{t("visible")}</label>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Text id={p("nzh")} label={t("nameZh")} value={d.nameZh} onChange={(v) => set({ nameZh: v })} />
        <Text id={p("nen")} label={t("nameEn")} value={d.nameEn} onChange={(v) => set({ nameEn: v })} />
        <Text id={p("tzh")} label={t("taglineZh")} value={d.taglineZh} onChange={(v) => set({ taglineZh: v })} />
        <Text id={p("ten")} label={t("taglineEn")} value={d.taglineEn} onChange={(v) => set({ taglineEn: v })} />
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={p("bzh")}>{t("benefitsZh")}</Label>
          <Textarea id={p("bzh")} defaultValue={d.benefitsZh.join("\n")} onChange={(e) => set({ benefitsZh: toLines(e.target.value) })} className="min-h-28 text-sm" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={p("ben")}>{t("benefitsEn")}</Label>
          <Textarea id={p("ben")} defaultValue={d.benefitsEn.join("\n")} onChange={(e) => set({ benefitsEn: toLines(e.target.value) })} className="min-h-28 text-sm" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Num id={p("dc")} label={t("defaultCredits")} value={d.defaultMonthlyCredits} onChange={(v) => set({ defaultMonthlyCredits: v })} />
        <Num id={p("dv")} label={t("defaultVideos")} value={d.defaultMonthlyVideos} onChange={(v) => set({ defaultMonthlyVideos: v })} />
        <Num id={p("rf")} label={t("referenceFee")} value={d.referenceFee / 100} onChange={(v) => set({ referenceFee: v * 100 })} />
        <Num id={p("so")} label={t("sortOrder")} value={d.sortOrder} onChange={(v) => set({ sortOrder: Math.min(100, v) })} />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">{t("matrix")}</span>
        <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
          {FEATURE_IDS.map((fid) => {
            const value = d.features[fid];
            const kind = kindOf(value);
            return (
              <div key={fid} className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate text-foreground/85">{tf(`features.${fid}`)}</span>
                <span className="flex shrink-0 items-center gap-1.5">
                  {kind === "number" && (
                    <input type="number" min={0} aria-label={t("value.number")} value={value as number} onChange={(e) => setFeature(fid, Math.max(0, Math.round(Number(e.target.value))))} className="h-8 w-20 rounded-md border bg-input/30 px-2 text-right tabular-nums" />
                  )}
                  <select value={kind} aria-label={tf(`features.${fid}`)} onChange={(e) => setFeature(fid, fromKind(e.target.value as Kind, value))} className="h-8 rounded-md border bg-input/30 px-2 text-xs [color-scheme:dark]">
                    {KINDS.map((k) => <option key={k} value={k}>{t(`value.${k}`)}</option>)}
                  </select>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div><Button size="lg" onClick={save} disabled={pending}>{t("save")}</Button></div>
    </section>
  );
}
