"use client";

import { useEffect, useState, useTransition, type RefObject } from "react";
import Image from "next/image";
import Link from "next/link";
import { CalendarClock, Check, Lock } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { approveFinalDesignAssetAction, scheduleDesignAction } from "@/lib/actions/designs";
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
  const [finalReviewed, setFinalReviewed] = useState(false);
  const [serverPreviewUrl, setServerPreviewUrl] = useState<string | null>(null);
  // An edited canvas invalidates the previously generated server image.
  useEffect(() => { setServerPreviewUrl(null); setFinalReviewed(false); }, [page]);
  const [at, setAt] = useState(() => toLocalInput(initialAt ?? new Date(Date.now() + 24 * 3600 * 1000)));
  const [pending, start] = useTransition();

  const toggle = (p: string) => {
    const isOn = platforms.includes(p);
    if (!isOn && lockReason(p) !== null) return;
    setPlatforms((v) => (isOn ? v.filter((x) => x !== p) : [...v, p]));
    setServerPreviewUrl(null); setFinalReviewed(false);
  };

  function generateFinalPreview() {
    start(async () => {
      setServerPreviewUrl(null);
      setFinalReviewed(false);
      if (!(await beforeSubmit())) return;
      if (!exportRef.current) { toast.error(t("saveFailed")); return; }
      try {
        const dataUrl = await renderPagePng(exportRef.current, page);
        const res = await fetch(`/api/designs/${designId}/publish-asset`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dataUrl }),
        });
        const json = await res.json() as { ok: boolean; url?: string };
        if (!res.ok || !json.ok || !json.url) throw new Error("upload failed");
        setServerPreviewUrl(json.url);
      } catch { toast.error(t("exportFailed")); }
    });
  }

  function submit() {
    start(async () => {
      const live = platforms.some(requiresConnection);
      if (live) {
        if (!finalReviewed || !serverPreviewUrl) {
          toast.error("请先生成服务器最终预览，检查图片与文案并确认。");
          return;
        }
        const approved = await approveFinalDesignAssetAction(designId, {
          mediaUrl: serverPreviewUrl, caption, confirmed: true,
        });
        if (!approved.ok) { toast.error(approved.error ?? "审核失败，请重试。"); return; }
      } else if (!(await beforeSubmit())) return;
      const exportedImageUrl = live ? serverPreviewUrl! : undefined;
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
            <Textarea value={caption} onChange={(e) => { setCaption(e.target.value); setFinalReviewed(false); }} rows={3} placeholder={t("captionPlaceholder")} maxLength={2200} />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm">{t("time")}</span>
            <input type="datetime-local" value={at} min={toLocalInput(new Date())} onChange={(e) => setAt(e.target.value)} className="h-10 rounded-lg border bg-input/30 px-3 text-sm [color-scheme:dark]" />
          </label>
          {platforms.some(requiresConnection) && (
            <div className="flex flex-col gap-2 rounded-md border p-3">
              <Button type="button" variant="outline" disabled={pending} onClick={generateFinalPreview}>
                {serverPreviewUrl ? "重新生成服务器最终预览" : "生成服务器最终预览"}
              </Button>
              {serverPreviewUrl && (
                <div className="flex flex-col items-center gap-2">
                  <Image src={serverPreviewUrl} alt="已在 PoStory 服务器保存、将提交给社媒平台的最终图片" width={240} height={260} unoptimized className="max-h-64 w-auto rounded object-contain" />
                  <p className="text-xs text-muted-foreground">请检查实际导出图中文字、字体、菜品和价格。这份文件通过后会锁定，不会在发布时重新绘制。</p>
                </div>
              )}
            </div>
          )}
          {platforms.some(requiresConnection) && (
            <label className="flex items-start gap-2 rounded-md border border-amber-400/40 p-3 text-xs leading-relaxed">
              <input type="checkbox" disabled={!serverPreviewUrl} checked={finalReviewed} onChange={(e) => setFinalReviewed(e.target.checked)} className="mt-0.5" />
              我已逐项检查上方服务器最终图片及下方社媒正文，确认它们就是客户批准的发布版本。修改后须重新审核。
            </label>
          )}
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
          <Button onClick={submit} disabled={pending || !hasPlan || platforms.length === 0 || !at || !caption.trim() || (platforms.some(requiresConnection) && (!finalReviewed || !serverPreviewUrl))}>
            {pending ? t("saving") : t("submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
