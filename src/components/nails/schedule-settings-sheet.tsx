"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { BusinessHours, ClosedPeriod } from "@/generated/prisma/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { saveScheduleSettingsAction, createClosedPeriodAction, deleteClosedPeriodAction } from "@/lib/actions/appointments";
import { BottomSheet } from "./bottom-sheet";

type Hours = Pick<BusinessHours, "weekday" | "isClosed" | "startMinute" | "endMinute">;
type Closed = Pick<ClosedPeriod, "id" | "startAt" | "endAt" | "reason">;
const DURATION_OPTIONS = [30, 45, 60, 75, 90, 120, 180];
const DAY_KEYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;

function options() {
  return Array.from({ length: 97 }, (_, i) => i).map((i) => {
    const hour = Math.floor((i * 15) / 60) % 24;
    const minute = (i * 15) % 60;
    const label = i === 96 ? "24:00" : `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
    return { value: i * 15, label };
  });
}

export function ScheduleSettingsSheet({ businessHours, durationMinutes, closedPeriods, timeZone, selectedDate }: { businessHours: Hours[]; durationMinutes: number; closedPeriods: Closed[]; timeZone: string; selectedDate: string }) {
  const t = useTranslations("nails");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [hours, setHours] = useState(businessHours);
  const [duration, setDuration] = useState(durationMinutes);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const timeOptions = options();

  function saveSchedule() {
    startTransition(async () => {
      const payload = new FormData();
      payload.set("schedule", JSON.stringify({ businessHours: hours, defaultDurationMinutes: duration }));
      const result = await saveScheduleSettingsAction(undefined, payload);
      if (!result?.ok) { setError(result?.error ?? t("scheduleSaveFailed")); return; }
      setError("");
      toast.success(result.message ?? t("scheduleSaved"));
      setOpen(false);
      router.refresh();
    });
  }

  return <BottomSheet open={open} onOpenChange={setOpen} trigger={t("scheduleSettings")} title={t("scheduleTitle")} description={t("scheduleDescription")}>
    <div className="space-y-6">
      <div className="space-y-2"><Label htmlFor="default-duration">{t("defaultDuration")}</Label><select id="default-duration" value={duration} onChange={(event) => setDuration(Number(event.target.value))} className="h-11 w-full rounded-lg border border-input bg-background px-3">{DURATION_OPTIONS.map((value) => <option key={value} value={value}>{t("durationMinutes", { minutes: value })}</option>)}</select></div>
      <div className="space-y-4">
        {hours.map((row) => <div key={row.weekday} className="space-y-2 rounded-xl border border-border p-3">
          <label className="flex min-h-11 items-center justify-between gap-3 font-medium"><span>{t(DAY_KEYS[row.weekday])}</span><span className="flex items-center gap-2 text-sm font-normal"><input type="checkbox" checked={!row.isClosed} onChange={(event) => setHours((all) => all.map((item) => item.weekday === row.weekday ? { ...item, isClosed: !event.target.checked } : item))} />{t("openDay")}</span></label>
          {!row.isClosed && <div className="grid grid-cols-2 gap-3"><label className="space-y-1 text-xs text-muted-foreground">{t("opensAt")}<select aria-label={`${t("opensAt")} · ${t(DAY_KEYS[row.weekday])}`} value={row.startMinute} onChange={(event) => setHours((all) => all.map((item) => item.weekday === row.weekday ? { ...item, startMinute: Number(event.target.value) } : item))} className="h-11 w-full rounded-lg border border-input bg-background px-2 text-sm text-foreground">{timeOptions.slice(0, 96).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            <label className="space-y-1 text-xs text-muted-foreground">{t("closesAt")}<select aria-label={`${t("closesAt")} · ${t(DAY_KEYS[row.weekday])}`} value={row.endMinute} onChange={(event) => setHours((all) => all.map((item) => item.weekday === row.weekday ? { ...item, endMinute: Number(event.target.value) } : item))} className="h-11 w-full rounded-lg border border-input bg-background px-2 text-sm text-foreground">{timeOptions.slice(1).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label></div>}
        </div>)}
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button disabled={pending} onClick={saveSchedule} className="h-12 w-full">{t(pending ? "working" : "saveSchedule")}</Button>

      <div className="space-y-4 border-t border-border pt-5">
        <h3 className="font-semibold">{t("closedPeriods")}</h3>
        {closedPeriods.map((period) => <div key={period.id} className="flex items-center justify-between gap-2 rounded-lg bg-muted px-3 py-2 text-sm"><span>{new Intl.DateTimeFormat(undefined, { timeZone, month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(period.startAt)}–{new Intl.DateTimeFormat(undefined, { timeZone, hour: "numeric", minute: "2-digit" }).format(period.endAt)}{period.reason ? ` · ${period.reason}` : ""}</span><Button size="sm" variant="ghost" onClick={() => startTransition(async () => { const result = await deleteClosedPeriodAction(period.id); if (result.ok) { toast.success(t("closedPeriodRemoved")); router.refresh(); } })}>{t("remove")}</Button></div>)}
        <form className="space-y-3" onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const data = new FormData(form);
          const start = `${data.get("startDate")}T${data.get("startTime")}`;
          const end = `${data.get("endDate")}T${data.get("endTime")}`;
          const payload = new FormData(); payload.set("start", start); payload.set("end", end); payload.set("reason", String(data.get("reason") ?? ""));
          startTransition(async () => { const result = await createClosedPeriodAction(undefined, payload); if (!result?.ok) setError(result?.error ?? t("closedPeriodInvalid")); else { setError(""); toast.success(t("closedPeriodSaved")); router.refresh(); form.reset(); } });
        }}>
          <div className="grid grid-cols-2 gap-2"><label className="text-xs text-muted-foreground">{t("fromDate")}<input name="startDate" type="date" required defaultValue={selectedDate} className="mt-1 h-11 w-full rounded-lg border border-input bg-background px-2 text-sm text-foreground" /></label><label className="text-xs text-muted-foreground">{t("fromTime")}<input name="startTime" type="time" required defaultValue="12:00" className="mt-1 h-11 w-full rounded-lg border border-input bg-background px-2 text-sm text-foreground" /></label><label className="text-xs text-muted-foreground">{t("toDate")}<input name="endDate" type="date" required defaultValue={selectedDate} className="mt-1 h-11 w-full rounded-lg border border-input bg-background px-2 text-sm text-foreground" /></label><label className="text-xs text-muted-foreground">{t("toTime")}<input name="endTime" type="time" required defaultValue="13:00" className="mt-1 h-11 w-full rounded-lg border border-input bg-background px-2 text-sm text-foreground" /></label></div>
          <label className="block space-y-1 text-xs text-muted-foreground">{t("reason")}<input name="reason" maxLength={120} className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground" /></label>
          <Button type="submit" variant="outline" disabled={pending} className="min-h-11 w-full">{t("closeTime")}</Button>
        </form>
      </div>
    </div>
  </BottomSheet>;
}
