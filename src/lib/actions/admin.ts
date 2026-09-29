"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { assertAdmin } from "@/lib/auth/session";
import { createUser, findUserRole, setUserDisabled } from "@/lib/db/users";
import { firstError, offlineAccountSchema, type FormState } from "@/lib/validation";

export async function adminCreateUserAction(_: FormState, formData: FormData): Promise<FormState> {
  await assertAdmin();
  const parsed = offlineAccountSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: await firstError(parsed.error) };
  const t = await getTranslations("admin");
  try {
    await createUser({ ...parsed.data, phone: parsed.data.phone || undefined, source: "OFFLINE", emailVerified: true });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return { error: t("errors.emailTaken") };
    throw e;
  }
  revalidatePath("/admin/accounts");
  return { ok: true, message: t("created", { name: parsed.data.name, email: parsed.data.email }) };
}

export async function adminToggleUserAction(id: string, disabled: boolean): Promise<{ ok: boolean; error?: string }> {
  await assertAdmin();
  const userId = z.string().max(40).parse(id);
  const [target, t] = await Promise.all([findUserRole(userId), getTranslations("admin.errors")]);
  if (!target) return { ok: false, error: t("notFound") };
  if (target.role === "ADMIN") return { ok: false, error: t("cannotDisableAdmin") };
  await setUserDisabled(userId, z.boolean().parse(disabled));
  revalidatePath("/admin/accounts");
  return { ok: true };
}
