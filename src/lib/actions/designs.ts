"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { assertUser, requireUser } from "@/lib/auth/session";
import { createDesignFromTemplate, deleteOwnDesign, updateOwnDesign } from "@/lib/db/designs";
import { designPagesSchema } from "@/lib/design-schema";
import { PUBLISH_TARGETS } from "@/lib/platforms";

export async function startDesignAction(templateId: string) {
  const user = await requireUser();
  const design = await createDesignFromTemplate(user.id, z.string().max(64).parse(templateId));
  if (!design) redirect("/templates");
  redirect(`/editor/${design.id}`);
}

export async function saveDesignAction(id: string, input: unknown): Promise<{ ok: boolean; error?: string }> {
  const user = await assertUser();
  const parsed = z.object({ title: z.string().trim().min(1).max(128), pages: designPagesSchema }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "作品数据格式不正确" };
  const ok = await updateOwnDesign(user.id, z.string().max(40).parse(id), parsed.data);
  if (ok) revalidatePath("/designs");
  return ok ? { ok } : { ok, error: "作品不存在" };
}

const scheduleSchema = z.object({
  platforms: z.array(z.enum(PUBLISH_TARGETS)).min(1, "至少选择一个发布平台"),
  scheduledAt: z.coerce.date().refine((d) => !Number.isNaN(d.getTime()), "请选择发布时间"),
});

export async function scheduleDesignAction(id: string, input: unknown): Promise<{ ok: boolean; error?: string }> {
  const user = await assertUser();
  const parsed = scheduleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };
  const ok = await updateOwnDesign(user.id, z.string().max(40).parse(id), { ...parsed.data, status: "SCHEDULED" });
  if (ok) revalidatePath("/designs");
  return ok ? { ok } : { ok, error: "作品不存在" };
}

export async function deleteDesignAction(id: string): Promise<{ ok: boolean }> {
  const user = await assertUser();
  const ok = await deleteOwnDesign(user.id, z.string().max(40).parse(id));
  if (ok) revalidatePath("/designs");
  return { ok };
}
