"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { confirmCalendarSlotAction } from "@/lib/actions/calendar";
import type { TemplateCard } from "@/lib/db/templates";
import { cn } from "@/lib/utils";

export type CalendarSlotView = {
  id: string;
  date: string; // YYYY-MM-DD
  status: "SUGGESTED" | "CONFIRMED" | "DESIGN_CREATED" | "PUBLISHED";
  weeklyRhythmTag: string | null;
  eventName: string | null;
  campaignName: string | null;
  designId: string | null;
  designStatus: string | null;
};

const STATUS_VARIANT: Record<CalendarSlotView["status"], "secondary" | "default" | "outline"> = {
  SUGGESTED: "outline",
  CONFIRMED: "secondary",
  DESIGN_CREATED: "default",
  PUBLISHED: "default",
};

export function CalendarMonthGrid({ yearMonth, slots, templates }: { yearMonth: string; slots: CalendarSlotView[]; templates: TemplateCard[] }) {
  const t = useTranslations("calendar");
  const [active, setActive] = useState<CalendarSlotView | null>(null);

  const cells = useMemo(() => {
    const [y, m] = yearMonth.split("-").map(Number);
    const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const firstWeekday = new Date(Date.UTC(y, m - 1, 1)).getUTCDay(); // 0=周日
    const slotByDate = new Map(slots.map((s) => [s.date, s]));
    const out: { date: string | null; slot: CalendarSlotView | null }[] = Array.from({ length: firstWeekday }, () => ({ date: null, slot: null }));
    for (let d = 1; d <= daysInMonth; d++) {
      const date = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      out.push({ date, slot: slotByDate.get(date) ?? null });
    }
    return out;
  }, [yearMonth, slots]);

  return (
    <>
      <div className="mt-6 grid grid-cols-7 gap-1.5 sm:gap-2">
        {cells.map((cell, i) =>
          cell.date === null ? (
            <div key={`pad-${i}`} />
          ) : (
            <button
              key={cell.date}
              type="button"
              disabled={!cell.slot}
              onClick={() => cell.slot && setActive(cell.slot)}
              className={cn(
                "flex min-h-20 flex-col items-start gap-1 rounded-lg border border-white/10 p-2 text-left text-xs transition-colors",
                cell.slot ? "cursor-pointer hover:bg-accent" : "opacity-40",
              )}
            >
              <span className="text-[11px] text-muted-foreground">{Number(cell.date.slice(-2))}</span>
              {cell.slot && (
                <>
                  <span className="line-clamp-2 text-[12px] leading-tight">{cell.slot.eventName ?? cell.slot.campaignName}</span>
                  <Badge variant={STATUS_VARIANT[cell.slot.status]} className="mt-auto">
                    {t(`status.${cell.slot.status}`)}
                  </Badge>
                </>
              )}
            </button>
          ),
        )}
      </div>

      <Dialog open={!!active} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{active?.eventName ?? active?.campaignName ?? t("drawer.title")}</DialogTitle>
          </DialogHeader>
          {active?.designId ? (
            <Link href={`/editor/${active.designId}`} className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              {t("drawer.pickTemplate")}
            </Link>
          ) : active && templates.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("drawer.noTemplates")}</p>
          ) : active ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {templates.map((tpl) => (
                <TemplatePickCard key={tpl.id} template={tpl} slotId={active.id} />
              ))}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

function TemplatePickCard({ template, slotId }: { template: TemplateCard; slotId: string }) {
  const t = useTranslations("calendar");
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await confirmCalendarSlotAction(slotId, template.id);
        })
      }
      className="group relative overflow-hidden rounded-lg border border-white/10 text-left transition-colors hover:border-primary/50 disabled:opacity-60"
    >
      <div className="relative w-full" style={{ aspectRatio: `${template.width} / ${template.height}` }}>
        <Image src={template.thumbnails[0]} alt={template.title} fill sizes="200px" className="object-cover" />
        {pending && (
          <div className="absolute inset-0 grid place-items-center bg-black/50">
            <Loader2 className="size-5 animate-spin text-white" />
          </div>
        )}
      </div>
      <p className="line-clamp-2 p-2 text-xs">{template.title}</p>
      <span className="sr-only">{t("drawer.pickTemplate")}</span>
    </button>
  );
}
