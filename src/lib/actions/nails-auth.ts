"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Prisma } from "@/generated/prisma/client";
import { createSession, destroySession } from "@/lib/auth/session";
import { issueLoginCode, consumeLoginCode } from "@/lib/db/email-tokens";
import { createUser, findUserByIdentifier, markEmailVerified } from "@/lib/db/users";
import { grantCredits } from "@/lib/db/credits";
import { SIGNUP_GIFT_CREDITS } from "@/lib/billing/plan-math";
import { sendMail } from "@/lib/mail";
import { nailsReturnPath } from "@/lib/nails/validation";
import { codeSchema, emailSchema, firstError, type FormState } from "@/lib/validation";

export async function requestNailsCodeAction(_: FormState, formData: FormData): Promise<FormState> {
  const email = emailSchema.safeParse(formData.get("email"));
  if (!email.success) return { error: await firstError(email.error) };
  const t = await getTranslations("auth.errors");
  // Never silently claim to send a sign-in code on a production server without mail.
  if (process.env.NODE_ENV === "production" && !process.env.RESEND_API_KEY) return { error: t("sendFailed") };
  const issued = await issueLoginCode(email.data);
  if (!issued.ok) return { error: t(issued.reason, { sec: issued.retryAfterSec }) };
  const mail = await getTranslations("nails");
  try {
    await sendMail({ to: email.data, subject: mail("codeSubject", { code: issued.secret }), text: mail("codeBody", { code: issued.secret }) });
  } catch {
    return { error: t("sendFailed") };
  }
  return { ok: true, message: email.data };
}

export async function verifyNailsCodeAction(_: FormState, formData: FormData): Promise<FormState> {
  const email = emailSchema.safeParse(formData.get("email"));
  const code = codeSchema.safeParse(formData.get("code"));
  if (!email.success) return { error: await firstError(email.error) };
  if (!code.success) return { error: await firstError(code.error) };
  const t = await getTranslations("auth.errors");
  const result = await consumeLoginCode(email.data, code.data);
  if (result !== "ok") return { error: t(({ invalid: "codeInvalid", expired: "codeExpired", tooMany: "codeTooMany" } as const)[result]) };

  // Same User table, password login and session as the main PoStory application.
  let user = await findUserByIdentifier(email.data);
  if (!user) {
    try {
      await createUser({ email: email.data, name: email.data.split("@")[0].slice(0, 64), password: randomBytes(32).toString("base64url"), source: "SELF_SIGNUP", emailVerified: true });
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) throw error;
    }
    user = await findUserByIdentifier(email.data);
  }
  if (!user || user.disabled) return { error: t("disabled") };
  if (!user.emailVerifiedAt) await markEmailVerified(user.id);
  await grantCredits({ userId: user.id, source: "SIGNUP_GIFT", scope: "TEMPLATE_ONLY", amount: SIGNUP_GIFT_CREDITS, refId: `signup-gift:${email.data}` });
  await createSession({ userId: user.id, role: user.role, sv: user.sessionVersion });
  redirect(nailsReturnPath(formData.get("next")));
}

export async function nailsLogoutAction() {
  await destroySession();
  redirect("/nails/login");
}
