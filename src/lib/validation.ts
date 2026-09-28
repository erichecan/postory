import { z } from "zod";
import { getTranslations } from "next-intl/server";
import validationMessages from "@/i18n/messages/zh/validation.json";

export const phoneSchema = z.string().trim().regex(/^1\d{10}$/, "phoneInvalid");
export const passwordSchema = z.string().min(8, "passwordMin").max(64, "passwordMax");
export const nameSchema = z.string().trim().min(1, "nameRequired").max(64, "nameMax");

export const registerSchema = z.object({ phone: phoneSchema, name: nameSchema, password: passwordSchema });
export const loginSchema = z.object({ phone: phoneSchema, password: z.string().min(1, "passwordRequired") });

export type FormState = { error?: string; ok?: boolean; message?: string } | undefined;

type ValidationKey = keyof typeof validationMessages;

function isValidationKey(key: string): key is ValidationKey {
  return key in validationMessages;
}

export async function firstError(error: z.ZodError) {
  const t = await getTranslations("validation");
  const issue = error.issues[0];
  if (!issue || !isValidationKey(issue.message)) return t("invalid");
  const max = "maximum" in issue && typeof issue.maximum === "number" ? issue.maximum : 0;
  return t(issue.message, { max });
}
