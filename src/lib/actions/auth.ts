"use server";

import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { createSession, destroySession } from "@/lib/auth/session";
import { createUser, findUserByPhone, verifyPassword } from "@/lib/db/users";
import { firstError, loginSchema, registerSchema, type FormState } from "@/lib/validation";

function safeNext(next: FormDataEntryValue | null) {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/templates";
}

export async function registerAction(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };
  try {
    const user = await createUser({ ...parsed.data, source: "SELF_SIGNUP" });
    await createSession({ userId: user.id, role: user.role });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { error: "该手机号已注册，请直接登录" };
    }
    throw e;
  }
  redirect("/onboarding");
}

export async function loginAction(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const user = await findUserByPhone(parsed.data.phone);
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return { error: "手机号或密码不正确" };
  }
  if (user.disabled) return { error: "该账号已停用，请联系门店" };
  await createSession({ userId: user.id, role: user.role });
  redirect(safeNext(formData.get("next")));
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
