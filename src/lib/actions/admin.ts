"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { assertAdmin } from "@/lib/auth/session";
import { createUser, setUserDisabled } from "@/lib/db/users";
import { firstError, registerSchema, type FormState } from "@/lib/validation";

export async function adminCreateUserAction(_: FormState, formData: FormData): Promise<FormState> {
  await assertAdmin();
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };
  try {
    await createUser({ ...parsed.data, source: "OFFLINE" });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return { error: "该手机号已有账号" };
    throw e;
  }
  revalidatePath("/admin/accounts");
  return { ok: true, message: `已开通：${parsed.data.name}（${parsed.data.phone}）` };
}

export async function adminToggleUserAction(id: string, disabled: boolean) {
  const admin = await assertAdmin();
  const userId = z.string().max(40).parse(id);
  if (userId === admin.id) throw new Error("不能停用自己的账号");
  await setUserDisabled(userId, z.boolean().parse(disabled));
  revalidatePath("/admin/accounts");
}
