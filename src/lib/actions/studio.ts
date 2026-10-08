"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createStudioForOwner, updateStudioForOwner } from "@/lib/db/studios";
import { requireNailsUser } from "@/lib/nails/workspace";
import { studioSchema } from "@/lib/nails/validation";
import type { FormState } from "@/lib/validation";

async function save(formData: FormData, create: boolean): Promise<FormState> {
  const user = await requireNailsUser(create ? "/nails/onboarding" : "/nails/me");
  const t = await getTranslations("nails");
  const parsed = studioSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const key = parsed.error.issues[0]?.message;
    return { error: t(key === "nameRequired" || key === "nameTooLong" || key === "timeZoneInvalid" ? key : "saveFailed") };
  }
  try {
    if (create) await createStudioForOwner(user.id, parsed.data);
    else await updateStudioForOwner(user.id, parsed.data);
  } catch (error) {
    console.error("Studio save failed", error instanceof Error ? error.name : "Unknown error");
    return { error: t("saveFailed") };
  }
  revalidatePath("/nails", "layout");
  if (create) redirect("/nails/create");
  return { ok: true, message: t("saved") };
}

export async function createStudioAction(_: FormState, formData: FormData) {
  return save(formData, true);
}

export async function updateStudioAction(_: FormState, formData: FormData) {
  return save(formData, false);
}
