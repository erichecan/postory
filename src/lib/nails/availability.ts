import { addLocalDays, localDateTimeToUtc, localMinutesAt, weekdayForDate } from "./time";

export type HoursRow = { weekday: number; isClosed: boolean; startMinute: number; endMinute: number };
export type TimeRange = { id?: string; startAt: Date; endAt: Date; status?: "CONFIRMED" | "CANCELLED" };
export type AvailableSlot = { startAt: Date; endAt: Date; localDate: string; localMinute: number };

export function computeAvailableSlots(input: {
  businessHours: HoursRow[];
  closedPeriods: TimeRange[];
  appointments: TimeRange[];
  localDate: string;
  timeZone: string;
  durationMinutes: number;
  ignoreAppointmentId?: string;
  stepMinutes?: number;
}): AvailableSlot[] {
  const { businessHours, closedPeriods, appointments, localDate, timeZone, durationMinutes } = input;
  if (!Number.isInteger(durationMinutes) || durationMinutes < 5 || durationMinutes > 720) return [];
  const row = businessHours.find((hours) => hours.weekday === weekdayForDate(localDate));
  if (!row || row.isClosed || row.endMinute <= row.startMinute) return [];
  const open = localDateTimeToUtc(localDate, row.startMinute, timeZone, "earlier");
  const close = localDateTimeToUtc(localDate, row.endMinute, timeZone, "later");
  if (!open || !close || close <= open) return [];
  const occupied = [
    ...closedPeriods,
    ...appointments.filter((appointment) => appointment.status !== "CANCELLED" && appointment.id !== input.ignoreAppointmentId),
  ].filter((period) => period.startAt < close && period.endAt > open);
  const step = input.stepMinutes ?? durationMinutes;
  if (!Number.isInteger(step) || step < 5 || step > durationMinutes) return [];
  const slots: AvailableSlot[] = [];
  const startMs = open.getTime();
  const closeMs = close.getTime();
  for (let ms = startMs; ms + durationMinutes * 60_000 <= closeMs; ms += step * 60_000) {
    const startAt = new Date(ms);
    const endAt = new Date(ms + durationMinutes * 60_000);
    if (occupied.some((period) => period.startAt < endAt && period.endAt > startAt)) continue;
    const local = localMinutesAt(startAt, timeZone);
    // Slots must start on the requested local calendar day; elapsed-time stepping
    // naturally skips nonexistent spring-forward wall times and preserves both fold instants.
    if (local.date === localDate) slots.push({ startAt, endAt, localDate: local.date, localMinute: local.minute });
  }
  return slots;
}

export function dayDateRange(localDate: string, view: "day" | "week"): string[] {
  if (view === "day") return [localDate];
  const weekday = weekdayForDate(localDate);
  const sunday = addLocalDays(localDate, -weekday);
  return Array.from({ length: 7 }, (_, i) => addLocalDays(sunday, i));
}

export function addDuration(startAt: Date, durationMinutes: number) {
  return new Date(startAt.getTime() + durationMinutes * 60_000);
}
