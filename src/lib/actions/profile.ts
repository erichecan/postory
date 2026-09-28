"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertUser } from "@/lib/auth/session";
import { upsertBrandProfile } from "@/lib/db/profiles";
import type { FormState } from "@/lib/validation";

const MAX_LOGO_DATA_URL = Math.ceil((2 * 1024 * 1024 * 4) / 3) + 64;

const optional = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `最多 ${max} 个字`)
    .transform((v) => (v === "" ? null : v));

const profileSchema = z.object({
  shopName: optional(64),
  slogan: optional(255),
  activity: optional(2000),
  wechat: optional(64),
  phone: optional(20),
  address: optional(255),
  logoUrl: z
    .string()
    .max(MAX_LOGO_DATA_URL, "Logo 不能超过 2MB")
    .refine((v) => v === "" || /^data:image\/(png|jpeg|webp);base64,/.test(v), "Logo 只支持 PNG、JPG、WebP")
    .transform((v) => (v === "" ? null : v)),
});

export async function saveProfileAction(_: FormState, formData: FormData): Promise<FormState> {
  const user = await assertUser();
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "输入有误" };
  await upsertBrandProfile(user.id, parsed.data);
  revalidatePath("/profile");
  return { ok: true, message: "商家资料已保存" };
}
