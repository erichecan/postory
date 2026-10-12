"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Appointment, BusinessHours, ClosedPeriod } from "@/generated/prisma/client";
import { cancelAppointmentAction } from "@/lib/actions/appointments";
import type { AvailableSlot } from "@/lib/nails/availability";
import { addLocalDays, localDateString, localPartsAt, minuteLabel, weekdayForDate } from "@/lib/nails/time";
import { Button } from "@/components/ui/button";
import { NailsCard } from "./primitives";
import { AppointmentSheet } from "./appointment-sheet";
import { ScheduleSettingsSheet } from "./schedule-settings-sheet";

type Hours = Pick<BusinessHours, "weekday" | "isClosed" | "startMinute" | "endMinute">;
type Closed = Pick<ClosedPeriod, "id" | "startAt" | "endAt" | "reason">;
type AppointmentItem = Pick<Appointment, "id" | "startAt" | "endAt" | "clientName" | "note" | "status">;

function timeLabel(instant: Date, timeZone: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { timeZone, hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(instant);
}

export function AppointmentsView({
  studioName, timeZone, localDate, dates, view, hours, duration, appointments, closedPeriods, availability,
}: {
  studioName: string; timeZone: string; localDate: string; dates: string[]; view: "day" | "week";
  hours: Hours[]; duration: number; appointments: AppointmentItem[]; closedPeriods: Closed[];
  availability: Record<string, AvailableSlot[]>;
}) {
  const t = useTranslations("nails");
  const locale = useLocale() === "zh" ? "zh-CN" : "en-CA";
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const shift = view === "day" ? 1 : 7;
  const prev = addLocalDays(localDate, -shift);
  const next = addLocalDays(localDate, shift);
  const rangeHref = (date: string, nextView = view) => `/nails/appointments?date=${date}&view=${nextView}`;
  const dayName = (date: string) => new Intl.DateTimeFormat(locale, { timeZone: "UTC", weekday: "short", month: "short", day: "numeric" }).format(new Date(`${date}T12:00:00Z`));

  function cancel(id: string) {
    if (!window.confirm(t("appointmentCancelConfirm"))) return;
    setPendingId(id);
    startTransition(async () => {
      const result = await cancelAppointmentAction(id);
      if (!result.ok) toast.error(result.error ?? t("appointmentNotFound"));
      else { toast.success(t("appointmentCancelled")); router.refresh(); }
      setPendingId(null);
    });
  }

  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="space-y-1"><p className="text-xs font-semibold uppercase tracking-wider text-primary">{studioName}</p><h1 className="text-2xl font-semibold tracking-tight">{t("appointmentsTitle")}</h1><p className="text-sm text-muted-foreground">{timeZone}</p></div>
      <ScheduleSettingsSheet businessHours={hours} durationMinutes={duration} closedPeriods={closedPeriods} timeZone={timeZone} selectedDate={localDate} />
    </div>
    <NailsCard className="gap-4 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1"><Button render={<Link href={rangeHref(prev)} />} variant="outline" size="icon" aria-label={t("previousPeriod")}><ChevronLeft /></Button><Button render={<Link href={rangeHref(next)} />} variant="outline" size="icon" aria-label={t("nextPeriod")}><ChevronRight /></Button><Button render={<Link href={rangeHref(localDate, "day")} />} variant="ghost" className="min-h-11">{t("today")}</Button></div>
        <div className="flex items-center rounded-lg border border-border p-1"><Link className={`rounded-md px-3 py-2 text-sm ${view === "day" ? "bg-accent text-primary" : "text-muted-foreground"}`} href={rangeHref(localDate, "day")}>{t("dayView")}</Link><Link className={`rounded-md px-3 py-2 text-sm ${view === "week" ? "bg-accent text-primary" : "text-muted-foreground"}`} href={rangeHref(localDate, "week")}>{t("weekView")}</Link></div>
      </div>
      <div className="grid gap-4">
        {dates.map((date) => {
          const weekDay = weekdayForDate(date);
          const dayHours = hours.find((row) => row.weekday === weekDay);
          const dayAppointments = appointments.filter((appointment) => localDateString(localPartsAt(appointment.startAt, timeZone)) === date && appointment.status === "CONFIRMED");
          const dayClosures = closedPeriods.filter((period) => localDateString(localPartsAt(period.startAt, timeZone)) === date);
          const slots = availability[date] ?? [];
          return <section key={date} className="space-y-3 rounded-xl border border-border p-4" aria-label={dayName(date)}>
            <div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="font-semibold">{dayName(date)}</h2><p className="mt-1 text-xs text-muted-foreground">{dayHours?.isClosed ? t("dayClosed") : dayHours ? `${minuteLabel(dayHours.startMinute)}–${minuteLabel(dayHours.endMinute)} · ${t("durationMinutes", { minutes: duration })}` : t("dayClosed")}</p></div>
              {view === "week" && <Button render={<Link href={rangeHref(date, "day")} />} variant="ghost" size="sm">{t("dayView")}<ChevronRight /></Button>}
            </div>
            {dayClosures.map((period) => <p key={period.id} className="rounded-lg bg-warning/10 px-3 py-2 text-sm text-warning-foreground">{t("closedTimeLabel")} · {timeLabel(period.startAt, timeZone, locale)}–{timeLabel(period.endAt, timeZone, locale)}{period.reason ? ` · ${period.reason}` : ""}</p>)}
            <div className="grid gap-2 sm:grid-cols-2">
              {dayAppointments.map((appointment) => <div key={appointment.id} className="flex min-h-16 items-center justify-between gap-3 rounded-lg bg-accent/70 p-3">
                <div className="min-w-0"><p className="truncate font-medium">{appointment.clientName}</p><p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Clock3 className="size-3" />{timeLabel(appointment.startAt, timeZone, locale)}–{timeLabel(appointment.endAt, timeZone, locale)}</p>{appointment.note && <p className="mt-1 truncate text-xs text-muted-foreground">{appointment.note}</p>}</div>
                <div className="flex shrink-0 items-center gap-1"><AppointmentSheet date={date} slots={slots} timeZone={timeZone} appointment={appointment} onDone={() => router.refresh()} /><Button size="icon" variant="ghost" disabled={pending && pendingId === appointment.id} aria-label={t("appointmentCancel")} onClick={() => cancel(appointment.id)}><Trash2 className="size-4" /></Button></div>
              </div>)}
              {slots.map((slot) => <AppointmentSheet key={`${date}-${slot.startAt.toISOString()}`} date={date} slots={[slot]} timeZone={timeZone} onDone={() => router.refresh()} />)}
            </div>
            {dayAppointments.length === 0 && slots.length === 0 && <p className="rounded-lg bg-muted px-4 py-5 text-center text-sm text-muted-foreground">{dayHours?.isClosed ? t("dayClosed") : t("noAvailability")}</p>}
          </section>;
        })}
      </div>
      <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground"><CalendarDays className="mt-0.5 size-4 shrink-0" />{t("availabilityHint")}</p>
    </NailsCard>
  </div>;
}
