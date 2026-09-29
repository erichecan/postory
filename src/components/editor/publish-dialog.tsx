"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CalendarClock, Check, Lock } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { scheduleDesignAction } from "@/lib/actions/designs";
import { PUBLISH_PLATFORMS, publishPlatformLabel } from "@/lib/platforms";
import { cn } from "@/lib/utils";

function toLocalInput(d: Date) {
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
}

export function PublishDialog({
  designId,
  initialPlatforms,
  initialAt,
  beforeSubmit,
  hasPlan,
  allowedPlatforms,
  onInsufficient,
}: {
  designId: string;
  initialPlatforms: string[];
  initialAt: Date | null;
  beforeSubmit: () => Promise<boolean>;
  hasPlan: boolean;
  allowedPlatforms: string[];
  onInsufficient: (need: number, have: number) => void;
}) {
  const t = useTranslations("editor.publish");
  const tp = useTranslations("platforms");
  const format = useFormatter();
  const [open, setOpen] = useState(false);
  const [platforms, setPlatforms] = useState<string[]>(initialPlatforms);
  const [at, setAt] = useState(() => toLocalInput(initialAt ?? new Date(Date.now() + 24 * 3600 * 1000)));
  const [pending, start] = useTransition();

  const toggle = (p: string) => allowedPlatforms.includes(p) && setPlatforms((v) => (v.includes(p) ? v.filter((x) => x !== p) : [...v, p]));

  function submit() {
    start(async () => {
      if (!(await beforeSubmit())) return;
      const res = await scheduleDesignAction(designId, { platforms, scheduledAt: new Date(at).toISOString() });
      if (!res.ok) {
        if (res.code === "insufficient") {
          setOpen(false);
          onInsufficient(res.need ?? 1, res.have ?? 0);
        } else toast.error(res.error ?? t("saveFailed"));
        return;
      }
      toast.success(t("scheduled"), { description: `${format.list(platforms.map((p) => publishPlatformLabel(tp, p)))} · ${format.dateTime(new Date(at), { dateStyle: "medium", timeStyle: "short" })}` });
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
                const locked = !allowedPlatforms.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => toggle(p)}
                    disabled={locked}
                    title={locked ? t("locked") : undefined}
                    className={cn("flex h-10 items-center justify-between rounded-lg border px-3 text-sm", on && "border-primary bg-primary/10", locked && "cursor-not-allowed opacity-40")}
                  >
                    {publishPlatformLabel(tp, p)}
                    {on && <Check className="size-4 text-primary" />}
                    {locked && <Lock className="size-3.5" />}
                  </button>
                );
              })}
            </div>
          </div>
          <label className="flex flex-col gap-2">
            <span className="text-sm">{t("time")}</span>
            <input type="datetime-local" value={at} min={toLocalInput(new Date())} onChange={(e) => setAt(e.target.value)} className="h-10 rounded-lg border bg-input/30 px-3 text-sm [color-scheme:dark]" />
          </label>
        </div>
        {hasPlan ? (
          <p className="text-xs text-muted-foreground">{t("chargeNote")}</p>
        ) : (
          <p className="rounded-md bg-amber-400/10 px-3 py-2 text-sm text-amber-200">
            {t("needPlan")} <Link href="/membership" className="underline">{t("needPlanLink")}</Link>
          </p>
        )}
        <DialogFooter>
          <Button onClick={submit} disabled={pending || !hasPlan || platforms.length === 0 || !at}>
            {pending ? t("saving") : t("submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
