"use client";

import { useState, useTransition, type RefObject } from "react";
import Link from "next/link";
import { CalendarClock, Check, Lock } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { scheduleDesignAction } from "@/lib/actions/designs";
import { PUBLISH_PLATFORMS, publishPlatformLabel, requiresConnection } from "@/lib/platforms";
import { cn } from "@/lib/utils";
import type { DesignPage } from "@/types/design";
import { renderPagePng } from "./export-page";

function toLocalInput(d: Date) {
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
}

export function PublishDialog({
  designId,
  initialPlatforms,
  initialAt,
  initialCaption,
  beforeSubmit,
  hasPlan,
  allowedPlatforms,
  connectedPlatforms,
  exportRef,
  page,
  onInsufficient,
}: {
  designId: string;
  initialPlatforms: string[];
  initialAt: Date | null;
  initialCaption: string | null;
  beforeSubmit: () => Promise<boolean>;
  hasPlan: boolean;
  allowedPlatforms: string[];
  connectedPlatforms: string[];
  exportRef: RefObject<HTMLDivElement | null>;
  page: DesignPage;
  onInsufficient: (need: number, have: number) => void;
}) {
  const t = useTranslations("editor.publish");
  const tp = useTranslations("platforms");
  const format = useFormatter();

  const lockReason = (p: string): "plan" | "connect" | null => {
    if (!allowedPlatforms.includes(p)) return "plan";
    if (requiresConnection(p) && !connectedPlatforms.includes(p)) return "connect";
    return null;
  };
  const [open, setOpen] = useState(false);
  // 一个平台后来变成被锁（比如断开了连接）时，不能留在已选列表里却又点不动按钮去掉它。
  const [platforms, setPlatforms] = useState<string[]>(() => initialPlatforms.filter((p) => lockReason(p) === null));
  const [caption, setCaption] = useState(initialCaption ?? "");
  const [at, setAt] = useState(() => toLocalInput(initialAt ?? new Date(Date.now() + 24 * 3600 * 1000)));
  const [pending, start] = useTransition();

  const toggle = (p: string) => {
    const isOn = platforms.includes(p);
    if (!isOn && lockReason(p) !== null) return;
    setPlatforms((v) => (isOn ? v.filter((x) => x !== p) : [...v, p]));
  };

  function submit() {
    start(async () => {
      if (!(await beforeSubmit())) return;
      let exportedImageUrl: string | undefined;
      if (platforms.some(requiresConnection)) {
        if (!exportRef.current) {
          toast.error(t("saveFailed"));
          return;
        }
        try {
          const dataUrl = await renderPagePng(exportRef.current, page);
          const res = await fetch(`/api/designs/${designId}/publish-asset`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dataUrl }),
          });
          const json = (await res.json()) as { ok: boolean; url?: string };
          if (!json.ok || !json.url) throw new Error("upload failed");
          exportedImageUrl = json.url;
        } catch {
          toast.error(t("exportFailed"));
          return;
        }
      }
      const res = await scheduleDesignAction(designId, { platforms, scheduledAt: new Date(at).toISOString(), caption, exportedImageUrl });
      if (!res.ok) {
        if (res.code === "insufficient") {
          setOpen(false);
          onInsufficient(res.need ?? 1, res.have ?? 0);
        } else toast.error(res.error ?? t("saveFailed"));
        return;
      }
      const resultKey = res.publishStatus === "FAILED" ? "publishFailed" : res.publishStatus === "PARTIAL" ? "publishPartial" : "scheduled";
      const toastFn = res.publishStatus === "FAILED" ? toast.error : toast.success;
      toastFn(t(resultKey), { description: `${format.list(platforms.map((p) => publishPlatformLabel(tp, p)))} · ${format.dateTime(new Date(at), { dateStyle: "medium", timeStyle: "short" })}` });
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" className="h-8 gap-1.5" />}>
        <CalendarClock className="size-4" /> {t("trigger")}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-sm">{t("targets")}</span>
            <div className="grid grid-cols-2 gap-2">
              {PUBLISH_PLATFORMS.map((p) => {
                const on = platforms.includes(p);
                const reason = lockReason(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => toggle(p)}
                    disabled={!on && reason !== null}
                    title={reason === "plan" ? t("locked") : reason === "connect" ? t("notConnected") : undefined}
                    className={cn("flex h-10 items-center justify-between rounded-lg border px-3 text-sm", on && "border-primary bg-primary/10", !on && reason && "cursor-not-allowed opacity-40")}
                  >
                    {publishPlatformLabel(tp, p)}
                    {on && <Check className="size-4 text-primary" />}
                    {reason && <Lock className="size-3.5" />}
                  </button>
                );
              })}
            </div>
          </div>
          <label className="flex flex-col gap-2">
            <span className="text-sm">{t("captionLabel")}</span>
            <Textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={3} placeholder={t("captionPlaceholder")} maxLength={2200} />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm">{t("time")}</span>
            <input type="datetime-local" value={at} min={toLocalInput(new Date())} onChange={(e) => setAt(e.target.value)} className="h-10 rounded-lg border bg-input/30 px-3 text-sm [color-scheme:dark]" />
          </label>
          {platforms.some(requiresConnection) && (
            <p className="text-xs text-muted-foreground">
              {t("connectHint")} <Link href="/profile" className="underline">{t("connectHintLink")}</Link>
            </p>
          )}
        </div>
        {hasPlan ? (
          <p className="text-xs text-muted-foreground">{t("chargeNote")}</p>
        ) : (
          <p className="rounded-md bg-amber-400/10 px-3 py-2 text-sm text-amber-200">
            {t("needPlan")} <Link href="/membership" className="underline">{t("needPlanLink")}</Link>
          </p>
        )}
        <DialogFooter>
          <Button onClick={submit} disabled={pending || !hasPlan || platforms.length === 0 || !at || !caption.trim()}>
            {pending ? t("saving") : t("submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
