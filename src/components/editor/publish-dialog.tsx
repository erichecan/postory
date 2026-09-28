"use client";

import { useState, useTransition } from "react";
import { CalendarClock, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { scheduleDesignAction } from "@/lib/actions/designs";
import { PUBLISH_TARGETS } from "@/lib/platforms";
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
}: {
  designId: string;
  initialPlatforms: string[];
  initialAt: Date | null;
  beforeSubmit: () => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const [platforms, setPlatforms] = useState<string[]>(initialPlatforms);
  const [at, setAt] = useState(() => toLocalInput(initialAt ?? new Date(Date.now() + 24 * 3600 * 1000)));
  const [pending, start] = useTransition();

  const toggle = (p: string) => setPlatforms((v) => (v.includes(p) ? v.filter((x) => x !== p) : [...v, p]));

  function submit() {
    start(async () => {
      if (!(await beforeSubmit())) return;
      const res = await scheduleDesignAction(designId, { platforms, scheduledAt: new Date(at).toISOString() });
      if (!res.ok) {
        toast.error(res.error ?? "保存失败");
        return;
      }
      toast.success("已加入发布计划", { description: `${platforms.join("、")} · ${new Date(at).toLocaleString("zh-CN")}` });
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" className="h-8 gap-1.5" />}>
        <CalendarClock className="size-4" /> 设定发布
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>设定发布计划</DialogTitle>
          <DialogDescription>选好要发的平台和时间，作品会出现在「我的作品」的发布计划里。</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-sm">发布到</span>
            <div className="grid grid-cols-2 gap-2">
              {PUBLISH_TARGETS.map((p) => {
                const on = platforms.includes(p);
                return (
                  <button key={p} type="button" onClick={() => toggle(p)} className={cn("flex h-10 items-center justify-between rounded-lg border px-3 text-sm", on && "border-primary bg-primary/10")}>
                    {p}
                    {on && <Check className="size-4 text-primary" />}
                  </button>
                );
              })}
            </div>
          </div>
          <label className="flex flex-col gap-2">
            <span className="text-sm">发布时间</span>
            <input type="datetime-local" value={at} onChange={(e) => setAt(e.target.value)} className="h-10 rounded-lg border bg-input/30 px-3 text-sm [color-scheme:dark]" />
          </label>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={pending || platforms.length === 0 || !at}>
            {pending ? "保存中…" : "加入发布计划"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
