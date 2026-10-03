"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getTranslations } from "next-intl/server";
import { assertUser } from "@/lib/auth/session";
import { upsertBrandProfile } from "@/lib/db/profiles";
import { firstError, type FormState } from "@/lib/validation";

const MAX_LOGO_DATA_URL = Math.ceil((2 * 1024 * 1024 * 4) / 3) + 64;

const optional = (max: number) =>
  z
    .string()
    .trim()
    .max(max, "maxLength")
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
    .max(MAX_LOGO_DATA_URL, "logoTooLarge")
    .refine((v) => v === "" || /^data:image\/(png|jpeg|webp);base64,/.test(v), "logoFormat")
    .transform((v) => (v === "" ? null : v)),
  industry: z
    .enum(["FOOD_TAKEAWAY", "BEAUTY_HAIR", "FITNESS", "PHONE_REPAIR", "OTHER", ""])
    .transform((v) => (v === "" ? null : v)),
  country: z.enum(["IE", "CA", ""]).transform((v) => (v === "" ? null : v)),
  whatsappNumber: optional(20),
  marketingEmailOptIn: z.string().optional().transform(Boolean),
  marketingSmsOptIn: z.string().optional().transform(Boolean),
});

export async function saveProfileAction(_: FormState, formData: FormData): Promise<FormState> {
  const user = await assertUser();
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: await firstError(parsed.error) };
  await upsertBrandProfile(user.id, parsed.data);
  revalidatePath("/profile");
  return { ok: true, message: (await getTranslations("profile"))("savedMessage") };
}
