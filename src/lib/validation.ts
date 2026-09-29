import { z } from "zod";
import { getTranslations } from "next-intl/server";
import validationMessages from "@/i18n/messages/zh/validation.json";

export const phoneSchema = z.string().trim().regex(/^1\d{10}$/, "phoneInvalid");
export const passwordSchema = z.string().min(8, "passwordMin").max(64, "passwordMax");
export const nameSchema = z.string().trim().min(1, "nameRequired").max(64, "nameMax");

export const emailSchema = z.string().trim().toLowerCase().max(254, "emailInvalid").pipe(z.email("emailInvalid"));
export const identifierSchema = z.union([emailSchema, phoneSchema], { error: "identifierInvalid" });
export const codeSchema = z.string().trim().regex(/^\d{6}$/, "codeInvalid");

export const registerSchema = z.object({ email: emailSchema, name: nameSchema, password: passwordSchema });
export const offlineAccountSchema = z.object({ email: emailSchema, phone: z.union([z.literal(""), phoneSchema]).optional(), name: nameSchema, password: passwordSchema });
export const loginSchema = z.object({ identifier: z.string().trim().toLowerCase().pipe(identifierSchema), password: z.string().min(1, "passwordRequired") });
export const resetRequestSchema = z.object({ email: emailSchema });
export const resetSchema = z.object({ email: emailSchema, token: z.string().min(20).max(100), password: passwordSchema });

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
