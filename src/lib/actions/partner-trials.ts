"use server";

import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { validateImageBytes } from "@/lib/ai/image-bytes";
import { getCurrentUser } from "@/lib/auth/session";
import { addTrialFeedback, addTrialReference, createTrialRequest, getTrialRequestByToken } from "@/lib/db/partner-trials";
import { isPublishPlatform } from "@/lib/platforms";
import { partnersRefKey, putObject } from "@/lib/storage";
import type { FormState } from "@/lib/validation";
import type { PartnerTrialFeedbackCategory } from "@/generated/prisma/client";

const INDUSTRY_VALUES = ["FOOD_TAKEAWAY", "BEAUTY_HAIR", "FITNESS", "PHONE_REPAIR", "OTHER"] as const;
const COUNTRY_VALUES = ["IE", "CA"] as const;
const FEEDBACK_CATEGORY_VALUES = ["STYLE", "CONTENT_ACCURACY", "REVISION_REQUEST"] as const;
const MAX_REFERENCE_FILES = 5;

const trialSchema = z.object({
  agencyName: z.string().trim().min(1).max(64),
  agencyContact: z.string().trim().min(1).max(128),
  clientBrandName: z.string().trim().min(1).max(128),
  industry: z.enum(INDUSTRY_VALUES),
  country: z.enum(COUNTRY_VALUES),
  productOrService: z.string().trim().min(1).max(2000),
  targetAudience: z.string().trim().max(2000),
  highlightNotes: z.string().trim().max(2000),
  websiteUrl: z.union([z.literal(""), z.string().trim().max(300).url()]),
  socialHandles: z.string().trim().max(1000),
  languagePreference: z.string().trim().min(1).max(8),
});

export async function submitPartnerTrialAction(_: FormState, formData: FormData): Promise<FormState> {
  const t = await getTranslations("partners.trial.errors");
  const parsed = trialSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: t("invalid") };

  const platforms = formData.getAll("platforms").map(String).filter(isPublishPlatform);

  const files = formData.getAll("referenceFiles").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length > MAX_REFERENCE_FILES) return { error: t("tooManyFiles") };

  const decoded: { bytes: Buffer; mime: string }[] = [];
  for (const file of files) {
    const bytes = Buffer.from(await file.arrayBuffer());
    const result = validateImageBytes(bytes);
    if (!result.ok) return { error: t(result.error === "tooLarge" ? "fileTooLarge" : "fileBadType") };
    decoded.push({ bytes: result.bytes, mime: result.mime });
  }

  const user = await getCurrentUser();

  const { request, duplicate } = await createTrialRequest({
    agencyUserId: user?.id ?? null,
    agencyName: parsed.data.agencyName,
    agencyContact: parsed.data.agencyContact,
    clientBrandName: parsed.data.clientBrandName,
    industry: parsed.data.industry,
    country: parsed.data.country,
    productOrService: parsed.data.productOrService,
    targetAudience: parsed.data.targetAudience || null,
    highlightNotes: parsed.data.highlightNotes || null,
    platforms,
    websiteUrl: parsed.data.websiteUrl || null,
    socialHandles: parsed.data.socialHandles || null,
    languagePreference: parsed.data.languagePreference,
  });

  // 判重命中已有申请时不再追加这次上传的参考资料，避免同一条申请下堆积"重复提交"产生的孤立文件。
  if (!duplicate) {
    for (const file of decoded) {
      const key = partnersRefKey(request.id, file.mime);
      try {
        await putObject(key, file.bytes);
        await addTrialReference(request.id, key, file.mime);
      } catch (error) {
        console.error("Partner trial reference storage failed", error instanceof Error ? error.name : "Unknown error");
      }
    }
  }

  redirect(`/partners/trial/${request.viewToken}`);
}

const feedbackSchema = z.object({
  token: z.string().trim().min(10).max(64),
  category: z.enum(FEEDBACK_CATEGORY_VALUES),
  content: z.string().trim().min(1).max(2000),
});

export async function submitPartnerTrialFeedbackAction(_: FormState, formData: FormData): Promise<FormState> {
  const t = await getTranslations("partners.view.errors");
  const parsed = feedbackSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: t("invalid") };

  const trial = await getTrialRequestByToken(parsed.data.token);
  if (!trial) return { error: t("invalid") };

  await addTrialFeedback(trial.id, parsed.data.category as PartnerTrialFeedbackCategory, parsed.data.content);
  return { ok: true };
}
