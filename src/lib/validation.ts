import { z } from "zod";

export const phoneSchema = z.string().trim().regex(/^1\d{10}$/, "请输入 11 位手机号");
export const passwordSchema = z.string().min(8, "密码至少 8 位").max(64, "密码最多 64 位");
export const nameSchema = z.string().trim().min(1, "请填写名称").max(64, "名称最多 64 个字");

export const registerSchema = z.object({ phone: phoneSchema, name: nameSchema, password: passwordSchema });
export const loginSchema = z.object({ phone: phoneSchema, password: z.string().min(1, "请输入密码") });

export type FormState = { error?: string; ok?: boolean; message?: string } | undefined;

export function firstError(error: z.ZodError) {
  return error.issues[0]?.message ?? "输入有误";
}
