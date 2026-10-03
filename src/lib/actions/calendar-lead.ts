"use server";

import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { createCalendarLead } from "@/lib/db/calendar";
import type { FormState } from "@/lib/validation";

const INDUSTRY_VALUES = ["FOOD_TAKEAWAY", "BEAUTY_HAIR", "FITNESS", "PHONE_REPAIR"] as const;
const COUNTRY_VALUES = ["IE", "CA"] as const;

const leadSchema = z.object({
  shopName: z.string().trim().min(1).max(128),
  industry: z.enum(INDUSTRY_VALUES),
  country: z.enum(COUNTRY_VALUES),
  contactEmail: z.string().trim().toLowerCase().max(254).pipe(z.email()),
  contactPhone: z.union([z.literal(""), z.string().trim().max(20).regex(/^[+0-9 ()-]{6,20}$/)]),
});

export async function submitCalendarLeadAction(_: FormState, formData: FormData): Promise<FormState> {
  const t = await getTranslations("calendar.preview.errors");
  const parsed = leadSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: t("invalid") };

  await createCalendarLead({
    shopName: parsed.data.shopName,
    industry: parsed.data.industry,
    country: parsed.data.country,
    contactEmail: parsed.data.contactEmail,
    contactPhone: parsed.data.contactPhone || null,
    generatedPreviewUrl: `/calendar-preview?industry=${parsed.data.industry}&country=${parsed.data.country}`,
  });
  return { ok: true };
}
