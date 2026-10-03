"use server";

import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Prisma } from "@/generated/prisma/client";
import { assertUser, createSession, destroySession } from "@/lib/auth/session";
import { SIGNUP_GIFT_CREDITS } from "@/lib/billing/plan-math";
import { grantCredits } from "@/lib/db/credits";
import { ensureDemoCommerce } from "@/lib/db/demo-commerce";
import { consumeResetToken, consumeVerifyCode, issueResetToken, issueVerifyCode, type IssueResult } from "@/lib/db/email-tokens";
import { clearLoginFailures, createUser, ensureDemoUser, findUserByEmail, findUserByIdentifier, markEmailVerified, recordLoginFailure, resetPassword, verifyPassword } from "@/lib/db/users";
import { sendMail } from "@/lib/mail";
import { DUMMY_HASH, safeNext } from "@/lib/safe-next";
import { codeSchema, firstError, loginSchema, registerSchema, resetRequestSchema, resetSchema, type FormState } from "@/lib/validation";
import { appUrl } from "@/lib/app-url";

type AuthErrorKey = "emailTaken" | "invalidCredentials" | "disabled" | "demoUnavailable" | "codeInvalid" | "codeExpired" | "codeTooMany" | "sendFailed" | "loginLocked";

async function authError(key: AuthErrorKey) {
  return (await getTranslations("auth.errors"))(key);
}

async function issueError(result: Extract<IssueResult, { ok: false }>) {
  return (await getTranslations("auth.errors"))(result.reason, { sec: result.retryAfterSec });
}

async function sendVerifyCode(email: string): Promise<string | null> {
  const issued = await issueVerifyCode(email);
  if (!issued.ok) return issueError(issued);
  const t = await getTranslations("auth.mail");
  try {
    await sendMail({ to: email, subject: t("verifySubject", { code: issued.secret }), text: t("verifyBody", { code: issued.secret }) });
  } catch (e) {
    console.error(e);
    return authError("sendFailed");
  }
  return null;
}

export async function registerAction(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: await firstError(parsed.error) };
  try {
    const user = await createUser({ ...parsed.data, source: "SELF_SIGNUP" });
    await createSession({ userId: user.id, role: user.role, sv: user.sessionVersion });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { error: await authError("emailTaken") };
    }
    throw e;
  }
  const sendError = await sendVerifyCode(parsed.data.email);
  redirect(sendError ? "/verify-email?sendFailed=1" : "/verify-email");
}

export async function loginAction(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: await firstError(parsed.error) };
  const user = await findUserByIdentifier(parsed.data.identifier);
  if (user?.loginLockedUntil && user.loginLockedUntil > new Date()) return { error: await authError("loginLocked") };
  const passwordOk = await verifyPassword(parsed.data.password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !passwordOk) {
    if (user) await recordLoginFailure(user.id);
    return { error: await authError("invalidCredentials") };
  }
  await clearLoginFailures(user.id);
  if (user.disabled) return { error: await authError("disabled") };
  await createSession({ userId: user.id, role: user.role, sv: user.sessionVersion });
  redirect(safeNext(formData.get("next")));
}

export async function demoLoginAction(): Promise<FormState> {
  const user = await ensureDemoUser();
  if (user.disabled || user.role !== "USER") return { error: await authError("demoUnavailable") };
  await ensureDemoCommerce(user.id);
  await createSession({ userId: user.id, role: user.role, sv: user.sessionVersion });
  redirect("/calendar");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export async function resendVerifyCodeAction(): Promise<FormState> {
  const user = await assertUser();
  if (!user.email || user.emailVerifiedAt) return { ok: true };
  const error = await sendVerifyCode(user.email);
  return error ? { error } : { ok: true, message: (await getTranslations("auth.verify"))("sent") };
}

export async function verifyEmailAction(_: FormState, formData: FormData): Promise<FormState> {
  const user = await assertUser();
  if (!user.email || user.emailVerifiedAt) redirect("/calendar");
  const code = codeSchema.safeParse(formData.get("code"));
  if (!code.success) return { error: await firstError(code.error) };
  const result = await consumeVerifyCode(user.email, code.data);
  if (result !== "ok") {
    const key = ({ invalid: "codeInvalid", expired: "codeExpired", tooMany: "codeTooMany" } as const)[result];
    return { error: await authError(key) };
  }
  await markEmailVerified(user.id);
  await grantCredits({ userId: user.id, source: "SIGNUP_GIFT", scope: "TEMPLATE_ONLY", amount: SIGNUP_GIFT_CREDITS, refId: `signup-gift:${user.email}` });
  redirect("/onboarding?gift=1");
}

export async function requestResetAction(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = resetRequestSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: await firstError(parsed.error) };
  const sent = (await getTranslations("auth.forgot"))("sent");
  const user = await findUserByEmail(parsed.data.email);
  if (!user || user.disabled) return { ok: true, message: sent };
  const issued = await issueResetToken(parsed.data.email);
  if (!issued.ok) return { ok: true, message: sent };
  const url = `${appUrl()}/reset-password?email=${encodeURIComponent(parsed.data.email)}&token=${issued.secret}`;
  const t = await getTranslations("auth.mail");
  try {
    await sendMail({ to: parsed.data.email, subject: t("resetSubject"), text: t("resetBody", { url }) });
  } catch (e) {
    console.error(e);
    return { error: await authError("sendFailed") };
  }
  return { ok: true, message: sent };
}

export async function resetPasswordAction(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = resetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: await firstError(parsed.error) };
  const invalid = (await getTranslations("auth.reset"))("invalid");
  const user = await findUserByEmail(parsed.data.email);
  if (!user || user.disabled) return { error: invalid };
  if ((await consumeResetToken(parsed.data.email, parsed.data.token)) !== "ok") return { error: invalid };
  await resetPassword(user.id, parsed.data.password);
  await destroySession();
  redirect("/login?reset=1");
}
