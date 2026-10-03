"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { assertUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { createDesignFromTemplate } from "@/lib/db/designs";
import { generateMonthSlots } from "@/lib/db/calendar";

export async function generateCalendarMonthAction(yearMonth: string) {
  const user = await assertUser();
  const parsed = z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .safeParse(yearMonth);
  if (!parsed.success) return { ok: false as const };
  const result = await generateMonthSlots(user.id, parsed.data);
  return result;
}

export async function confirmCalendarSlotAction(slotId: string, templateId: string) {
  const user = await assertUser();
  const safeSlotId = z.string().max(40).safeParse(slotId);
  const safeTemplateId = z.string().max(64).safeParse(templateId);
  if (!safeSlotId.success || !safeTemplateId.success) return { ok: false as const, error: "invalid" };

  // 必须是这个用户自己的日历格子，不能靠猜 id 确认别人的（附录A鉴权探针）。
  const slot = await prisma.calendarSlot.findFirst({
    where: { id: safeSlotId.data, userId: user.id },
    select: { id: true, campaignTemplate: { select: { nameZh: true, captionAngle: true } }, event: { select: { nameZh: true } } },
  });
  if (!slot) return { ok: false as const, error: "notFound" };

  const design = await createDesignFromTemplate(user.id, safeTemplateId.data);
  if (!design) return { ok: false as const, error: "templateNotFound" };

  const caption = [slot.event?.nameZh, slot.campaignTemplate?.nameZh].filter(Boolean).join(" · ") || undefined;
  await prisma.calendarSlot.update({
    where: { id: slot.id },
    data: { designId: design.id, status: "DESIGN_CREATED" },
  });
  if (caption) await prisma.design.update({ where: { id: design.id }, data: { caption } });

  redirect(`/editor/${design.id}`);
}
