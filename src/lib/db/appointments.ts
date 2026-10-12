import "server-only";
import { prisma } from "./client";
import type { Prisma } from "@/generated/prisma/client";
import { addLocalDays, localDayBounds, todayInZone } from "@/lib/nails/time";
import { computeAvailableSlots, dayDateRange, type HoursRow } from "@/lib/nails/availability";

const DEFAULT_HOURS = Array.from({ length: 7 }, (_, weekday) => ({
  weekday, isClosed: weekday === 0 || weekday === 6, startMinute: 540, endMinute: 1080,
}));

async function withOwner<T>(userId: string, run: (tx: Prisma.TransactionClient) => Promise<T>) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT set_config('app.studio_owner_id', ${userId}, true)`;
    const studio = await tx.studio.findUnique({ where: { ownerId: userId } });
    if (!studio) throw new Error("Studio not found");
    return run(tx);
  });
}

async function lockStudioAppointments(tx: Prisma.TransactionClient, studioId: string) {
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${studioId}, 0))::text`;
}

async function ensureHours(tx: Prisma.TransactionClient, studioId: string) {
  await tx.businessHours.createMany({ data: DEFAULT_HOURS.map((hours) => ({ studioId, ...hours })), skipDuplicates: true });
  return tx.businessHours.findMany({ where: { studioId }, orderBy: { weekday: "asc" } });
}

export async function getAppointmentsForOwner(userId: string, requestedDate?: string, view: "day" | "week" = "day") {
  return withOwner(userId, async (tx) => {
    const studio = await tx.studio.findUniqueOrThrow({ where: { ownerId: userId } });
    const localDate = requestedDate && /^\d{4}-\d{2}-\d{2}$/.test(requestedDate) ? requestedDate : todayInZone(studio.timeZone);
    const dates = dayDateRange(localDate, view);
    const dayStart = localDayBounds(dates[0], studio.timeZone).start;
    const dayEnd = localDayBounds(dates[dates.length - 1], studio.timeZone).end;
    const businessHours = await ensureHours(tx, studio.id);
    const [appointments, closedPeriods] = await Promise.all([
      tx.appointment.findMany({ where: { studioId: studio.id, startAt: { lt: dayEnd }, endAt: { gt: dayStart } }, orderBy: { startAt: "asc" } }),
      tx.closedPeriod.findMany({ where: { studioId: studio.id, startAt: { lt: dayEnd }, endAt: { gt: dayStart } }, orderBy: { startAt: "asc" } }),
    ]);
    const availabilityByDate = Object.fromEntries(dates.map((date) => [date, computeAvailableSlots({
      businessHours, closedPeriods, appointments, localDate: date, timeZone: studio.timeZone,
      durationMinutes: studio.defaultDurationMinutes,
    })]));
    return { studio, localDate, dates, view, businessHours, appointments, closedPeriods, availabilityByDate };
  });
}

export async function saveScheduleForOwner(userId: string, input: { defaultDurationMinutes: number; businessHours: HoursRow[] }) {
  return withOwner(userId, async (tx) => {
    const studio = await tx.studio.findUniqueOrThrow({ where: { ownerId: userId } });
    await lockStudioAppointments(tx, studio.id);
    await tx.studio.update({ where: { ownerId: userId }, data: { defaultDurationMinutes: input.defaultDurationMinutes } });
    await Promise.all(input.businessHours.map(({ weekday, isClosed, startMinute, endMinute }) => tx.businessHours.upsert({
      where: { studioId_weekday: { studioId: studio.id, weekday } },
      create: { studioId: studio.id, weekday, isClosed, startMinute, endMinute },
      update: { isClosed, startMinute, endMinute },
    })));
  });
}

export async function listAvailabilityForOwner(userId: string, date: string) {
  return withOwner(userId, async (tx) => {
    const studio = await tx.studio.findUniqueOrThrow({ where: { ownerId: userId } });
    const { start, end } = localDayBounds(date, studio.timeZone);
    const businessHours = await ensureHours(tx, studio.id);
    const [appointments, closedPeriods] = await Promise.all([
      tx.appointment.findMany({ where: { studioId: studio.id, startAt: { lt: end }, endAt: { gt: start } }, orderBy: { startAt: "asc" } }),
      tx.closedPeriod.findMany({ where: { studioId: studio.id, startAt: { lt: end }, endAt: { gt: start } } }),
    ]);
    return { studio, businessHours, appointments, closedPeriods };
  });
}

export async function listUpcomingAvailabilityForOwner(userId: string, dayCount = 21) {
  return withOwner(userId, async (tx) => {
    const studio = await tx.studio.findUniqueOrThrow({ where: { ownerId: userId } });
    const startDate = todayInZone(studio.timeZone);
    const dates = Array.from({ length: dayCount }, (_, i) => addLocalDays(startDate, i));
    const start = localDayBounds(dates[0], studio.timeZone).start;
    const end = localDayBounds(dates[dates.length - 1], studio.timeZone).end;
    const [businessHours, appointments, closedPeriods] = await Promise.all([
      ensureHours(tx, studio.id),
      tx.appointment.findMany({ where: { studioId: studio.id, startAt: { lt: end }, endAt: { gt: start } } }),
      tx.closedPeriod.findMany({ where: { studioId: studio.id, startAt: { lt: end }, endAt: { gt: start } } }),
    ]);
    const now = Date.now();
    return { studio, availabilityByDate: Object.fromEntries(dates.map((date) => [date, computeAvailableSlots({ businessHours, appointments, closedPeriods, localDate: date, timeZone: studio.timeZone, durationMinutes: studio.defaultDurationMinutes }).filter((slot) => slot.startAt.getTime() > now)])) };
  });
}

export async function createAppointmentForOwner(userId: string, input: { date: string; startAt: Date; clientName: string; note: string }) {
  return withOwner(userId, async (tx) => {
    const { studio } = await listAvailabilityInTransaction(tx, userId, input.date);
    await lockStudioAppointments(tx, studio.id);
    const current = await listAvailabilityInTransaction(tx, userId, input.date);
    const slots = computeAvailableSlots({ businessHours: current.businessHours, appointments: current.appointments, closedPeriods: current.closedPeriods, localDate: input.date, timeZone: studio.timeZone, durationMinutes: current.studio.defaultDurationMinutes });
    const slot = slots.find((candidate) => candidate.startAt.getTime() === input.startAt.getTime());
    if (!slot) throw new Error("APPOINTMENT_SLOT_UNAVAILABLE");
    return tx.appointment.create({ data: {
      studioId: studio.id, startAt: slot.startAt, endAt: slot.endAt,
      clientName: input.clientName, note: input.note || null,
    } });
  });
}

async function listAvailabilityInTransaction(tx: Prisma.TransactionClient, userId: string, date: string) {
  const studio = await tx.studio.findUniqueOrThrow({ where: { ownerId: userId } });
  const { start, end } = localDayBounds(date, studio.timeZone);
  const businessHours = await ensureHours(tx, studio.id);
  const [appointments, closedPeriods] = await Promise.all([
    tx.appointment.findMany({ where: { studioId: studio.id, startAt: { lt: end }, endAt: { gt: start } } }),
    tx.closedPeriod.findMany({ where: { studioId: studio.id, startAt: { lt: end }, endAt: { gt: start } } }),
  ]);
  return { studio, businessHours, appointments, closedPeriods };
}

export async function updateAppointmentForOwner(userId: string, input: { id: string; date: string; startAt: Date; clientName: string; note: string }) {
  return withOwner(userId, async (tx) => {
    const { studio } = await listAvailabilityInTransaction(tx, userId, input.date);
    await lockStudioAppointments(tx, studio.id);
    const current = await listAvailabilityInTransaction(tx, userId, input.date);
    const owned = await tx.appointment.findFirst({ where: { id: input.id, studioId: studio.id, status: "CONFIRMED" } });
    if (!owned) throw new Error("APPOINTMENT_NOT_FOUND");
    const slots = computeAvailableSlots({ businessHours: current.businessHours, appointments: current.appointments, closedPeriods: current.closedPeriods, localDate: input.date, timeZone: studio.timeZone, durationMinutes: current.studio.defaultDurationMinutes, ignoreAppointmentId: owned.id });
    const slot = slots.find((candidate) => candidate.startAt.getTime() === input.startAt.getTime());
    if (!slot) throw new Error("APPOINTMENT_SLOT_UNAVAILABLE");
    return tx.appointment.update({ where: { id: owned.id }, data: { startAt: slot.startAt, endAt: slot.endAt, clientName: input.clientName, note: input.note || null } });
  });
}

export async function cancelAppointmentForOwner(userId: string, id: string) {
  return withOwner(userId, async (tx) => {
    const studio = await tx.studio.findUniqueOrThrow({ where: { ownerId: userId } });
    await lockStudioAppointments(tx, studio.id);
    return tx.appointment.updateMany({ where: { id, studioId: studio.id, status: "CONFIRMED" }, data: { status: "CANCELLED" } });
  });
}

export async function createClosedPeriodForOwner(userId: string, input: { startAt: Date; endAt: Date; reason: string }) {
  return withOwner(userId, async (tx) => {
    const studio = await tx.studio.findUniqueOrThrow({ where: { ownerId: userId } });
    const overlap = await tx.appointment.findFirst({ where: { studioId: studio.id, status: "CONFIRMED", startAt: { lt: input.endAt }, endAt: { gt: input.startAt } }, select: { id: true } });
    if (overlap) throw new Error("CLOSED_PERIOD_CONFLICT");
    return tx.closedPeriod.create({ data: { studioId: studio.id, ...input, reason: input.reason || null } });
  });
}

export async function deleteClosedPeriodForOwner(userId: string, id: string) {
  return withOwner(userId, async (tx) => {
    const studio = await tx.studio.findUniqueOrThrow({ where: { ownerId: userId } });
    return tx.closedPeriod.deleteMany({ where: { id, studioId: studio.id } });
  });
}
