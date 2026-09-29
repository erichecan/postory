"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { assertUser, requireUser } from "@/lib/auth/session";
import { createDesignFromTemplate, deleteOwnDesign, updateOwnDesign } from "@/lib/db/designs";
import { designPagesSchema } from "@/lib/design-schema";
import { PUBLISH_PLATFORMS } from "@/lib/platforms";
import { firstError } from "@/lib/validation";

export async function startDesignAction(templateId: string) {
  const user = await requireUser();
  const design = await createDesignFromTemplate(user.id, z.string().max(64).parse(templateId));
  if (!design) redirect("/templates");
  redirect(`/editor/${design.id}`);
}

async function designError(key: "invalidData" | "notFound") {
  return (await getTranslations("designs.errors"))(key);
}

export async function saveDesignAction(id: string, input: unknown): Promise<{ ok: boolean; error?: string }> {
  const user = await assertUser();
  const parsed = z.object({ title: z.string().trim().min(1).max(128), pages: designPagesSchema }).safeParse(input);
  if (!parsed.success) return { ok: false, error: await designError("invalidData") };
  const ok = await updateOwnDesign(user.id, z.string().max(40).parse(id), parsed.data);
  if (ok) revalidatePath("/designs");
  return ok ? { ok } : { ok, error: await designError("notFound") };
}

const scheduleSchema = z.object({
  platforms: z.array(z.enum(PUBLISH_PLATFORMS)).min(1, "publishPlatformsRequired"),
  scheduledAt: z
    .string({ error: "publishTimeRequired" })
    .transform((v) => new Date(v))
    .refine((d) => !Number.isNaN(d.getTime()), "publishTimeRequired")
    .refine((d) => d.getTime() > Date.now() - 60_000, "publishTimePast"),
});

export async function scheduleDesignAction(id: string, input: unknown): Promise<{ ok: boolean; error?: string }> {
  const user = await assertUser();
  const parsed = scheduleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: await firstError(parsed.error) };
  const ok = await updateOwnDesign(user.id, z.string().max(40).parse(id), { ...parsed.data, status: "SCHEDULED" });
  if (ok) revalidatePath("/designs");
  return ok ? { ok } : { ok, error: await designError("notFound") };
}

export async function deleteDesignAction(id: string): Promise<{ ok: boolean }> {
  const user = await assertUser();
  const ok = await deleteOwnDesign(user.id, z.string().max(40).parse(id));
  if (ok) revalidatePath("/designs");
  return { ok };
}
