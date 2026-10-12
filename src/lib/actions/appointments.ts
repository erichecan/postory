"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { requireNailsUser } from "@/lib/nails/workspace";
import {
  cancelAppointmentForOwner, createAppointmentForOwner, createClosedPeriodForOwner,
  deleteClosedPeriodForOwner, saveScheduleForOwner, updateAppointmentForOwner,
} from "@/lib/db/appointments";
import { localDateTimeToUtc } from "@/lib/nails/time";
import { localDateParts } from "@/lib/nails/time";
import { findStudioForOwner } from "@/lib/db/studios";
import type { FormState } from "@/lib/validation";
import { z } from "zod";

const minuteSchema = z.coerce.number().int().min(0).max(1440);
const dateSchema = z.string().refine((value) => localDateParts(value) !== null);
const durationSchema = z.coerce.number().int().min(15).max(720).refine((n) => n % 15 === 0);
const appointmentSchema = z.object({
  id: z.string().cuid().optional(),
  date: dateSchema,
  startAt: z.string().datetime({ offset: true }),
  clientName: z.string().trim().min(1).max(80),
  note: z.string().trim().max(280).default(""),
});
const scheduleSchema = z.object({
  defaultDurationMinutes: durationSchema,
  businessHours: z.array(z.object({
    weekday: z.coerce.number().int().min(0).max(6),
    isClosed: z.boolean(),
    startMinute: minuteSchema,
    endMinute: minuteSchema,
  })).length(7).refine((hours) => new Set(hours.map((row) => row.weekday)).size === 7),
}).refine(({ businessHours }) => businessHours.every((row) => row.isClosed || row.endMinute > row.startMinute));

function isAppointmentConflict(error: unknown) {
  const value = error as { code?: string; message?: string; meta?: { code?: string; message?: string } };
  return value?.code === "23P01" || value?.code === "P2004" || value?.meta?.code === "23P01" ||
    `${value?.message ?? ""} ${value?.meta?.message ?? ""}`.includes("appointment_no_overlap");
}

async function errorState(error: unknown): Promise<FormState> {
  const t = await getTranslations("nails");
  const message = error instanceof Error ? error.message : "";
  if (message === "APPOINTMENT_SLOT_UNAVAILABLE") return { error: t("appointmentSlotUnavailable") };
  if (message === "APPOINTMENT_NOT_FOUND") return { error: t("appointmentNotFound") };
  if (message === "CLOSED_PERIOD_CONFLICT") return { error: t("closedPeriodConflict") };
  if (isAppointmentConflict(error)) return { error: t("appointmentConflict") };
  console.error("Appointment action failed", error instanceof Error ? error.name : "Unknown error");
  return { error: t("appointmentSaveFailed") };
}

export async function saveScheduleSettingsAction(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireNailsUser("/nails/appointments");
  let raw: unknown;
  try { raw = JSON.parse(String(formData.get("schedule") ?? "")); } catch { return { error: await (await getTranslations("nails"))("scheduleSaveFailed") }; }
  const parsed = scheduleSchema.safeParse(raw);
  const t = await getTranslations("nails");
  if (!parsed.success) return { error: t("scheduleInvalid") };
  try {
    await saveScheduleForOwner(user.id, parsed.data);
    revalidatePath("/nails/appointments");
    return { ok: true, message: t("scheduleSaved") };
  } catch (error) { return errorState(error); }
}

export async function saveAppointmentAction(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireNailsUser("/nails/appointments");
  const parsed = appointmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: (await getTranslations("nails"))("appointmentInvalid") };
  try {
    const input = { ...parsed.data, startAt: new Date(parsed.data.startAt) };
    if (parsed.data.id) await updateAppointmentForOwner(user.id, { ...input, id: parsed.data.id });
    else await createAppointmentForOwner(user.id, input);
    revalidatePath("/nails/appointments");
    revalidatePath("/nails/create");
    return { ok: true };
  } catch (error) { return errorState(error); }
}

export async function cancelAppointmentAction(id: string) {
  const user = await requireNailsUser("/nails/appointments");
  const parsed = z.string().cuid().safeParse(id);
  if (!parsed.success) return { ok: false as const, error: (await getTranslations("nails"))("appointmentNotFound") };
  const result = await cancelAppointmentForOwner(user.id, parsed.data);
  revalidatePath("/nails/appointments");
  revalidatePath("/nails/create");
  return result.count ? { ok: true as const } : { ok: false as const, error: (await getTranslations("nails"))("appointmentNotFound") };
}

const closedSchema = z.object({
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/),
  reason: z.string().trim().max(120).default(""),
});

export async function createClosedPeriodAction(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireNailsUser("/nails/appointments");
  const parsed = closedSchema.safeParse(Object.fromEntries(formData));
  const t = await getTranslations("nails");
  if (!parsed.success) return { error: t("closedPeriodInvalid") };
  const studio = await findStudioForOwner(user.id);
  if (!studio) return { error: t("appointmentSaveFailed") };
  const toInstant = (value: string, later: boolean) => {
    const [date, time] = value.split("T");
    const [hour, minute] = time.split(":").map(Number);
    return localDateTimeToUtc(date, hour * 60 + minute, studio.timeZone, later ? "later" : "earlier");
  };
  const startAt = toInstant(parsed.data.start, false);
  const endAt = toInstant(parsed.data.end, true);
  if (!startAt || !endAt || endAt <= startAt) return { error: t("closedPeriodInvalid") };
  try {
    await createClosedPeriodForOwner(user.id, { startAt, endAt, reason: parsed.data.reason });
    revalidatePath("/nails/appointments");
    revalidatePath("/nails/create");
    return { ok: true, message: t("closedPeriodSaved") };
  } catch (error) { return errorState(error); }
}

export async function deleteClosedPeriodAction(id: string) {
  const user = await requireNailsUser("/nails/appointments");
  const parsed = z.string().cuid().safeParse(id);
  if (!parsed.success) return { ok: false as const };
  await deleteClosedPeriodForOwner(user.id, parsed.data);
  revalidatePath("/nails/appointments");
  revalidatePath("/nails/create");
  return { ok: true as const };
}
