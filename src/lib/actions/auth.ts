"use server";

import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Prisma } from "@/generated/prisma/client";
import { createSession, destroySession } from "@/lib/auth/session";
import { ensureDemoCommerce } from "@/lib/db/demo-commerce";
import { createUser, ensureDemoUser, findUserByPhone, verifyPassword } from "@/lib/db/users";
import { DUMMY_HASH, safeNext } from "@/lib/safe-next";
import { firstError, loginSchema, registerSchema, type FormState } from "@/lib/validation";

async function authError(key: "phoneTaken" | "invalidCredentials" | "disabled" | "demoUnavailable") {
  return (await getTranslations("auth.errors"))(key);
}

export async function registerAction(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: await firstError(parsed.error) };
  try {
    const user = await createUser({ ...parsed.data, source: "SELF_SIGNUP" });
    await createSession({ userId: user.id, role: user.role });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { error: await authError("phoneTaken") };
    }
    throw e;
  }
  redirect("/onboarding");
}

export async function loginAction(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: await firstError(parsed.error) };
  const user = await findUserByPhone(parsed.data.phone);
  const passwordOk = await verifyPassword(parsed.data.password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !passwordOk) {
    return { error: await authError("invalidCredentials") };
  }
  if (user.disabled) return { error: await authError("disabled") };
  await createSession({ userId: user.id, role: user.role });
  redirect(safeNext(formData.get("next")));
}

export async function demoLoginAction(): Promise<FormState> {
  const user = await ensureDemoUser();
  if (user.disabled || user.role !== "USER") return { error: await authError("demoUnavailable") };
  await ensureDemoCommerce(user.id);
  await createSession({ userId: user.id, role: user.role });
  redirect("/templates");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
