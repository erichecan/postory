"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { validateImageBytes } from "@/lib/ai/image-bytes";
import { generatePartnerTrialPlan } from "@/lib/ai/partner-trial-plan";
import { getCurrentUser } from "@/lib/auth/session";
import { addTrialFeedback, addTrialReference, createTrialRequest, getTrialRequestByToken, saveTrialPlan, updateTrialDetails } from "@/lib/db/partner-trials";
import { isPublishPlatform } from "@/lib/platforms";
import { deleteObject, partnersRefKey, putObject } from "@/lib/storage";
import type { FormState } from "@/lib/validation";
import type { PartnerTrialFeedbackCategory } from "@/generated/prisma/client";

const INDUSTRY_VALUES = ["FOOD_TAKEAWAY", "BEAUTY_HAIR", "FITNESS", "PHONE_REPAIR", "OTHER"] as const;
const COUNTRY_VALUES = ["IE", "CA"] as const;
const FEEDBACK_CATEGORY_VALUES = ["STYLE", "CONTENT_ACCURACY", "REVISION_REQUEST"] as const;
const MAX_REFERENCE_FILES = 5;
const MAX_REFERENCE_BATCH_BYTES = 10 * 1024 * 1024;

const trialSchema = z.object({
  agencyName: z.string().trim().min(1).max(64),
  agencyContact: z.string().trim().min(1).max(128),
  clientBrandName: z.string().trim().min(1).max(128),
  industry: z.enum(INDUSTRY_VALUES),
  country: z.enum(COUNTRY_VALUES),
  marketArea: z.string().trim().min(1).max(128),
  productOrService: z.string().trim().min(1).max(2000),
  targetAudience: z.string().trim().min(1).max(2000),
  highlightNotes: z.string().trim().min(1).max(2000),
  websiteUrl: z.union([z.literal(""), z.string().trim().max(300).url()]),
  socialHandles: z.string().trim().max(1000),
  languagePreference: z.string().trim().min(1).max(8),
});

export async function submitPartnerTrialAction(_: FormState, formData: FormData): Promise<FormState> {
  const t = await getTranslations("partners.trial.errors");
  const parsed = trialSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: t("invalid") };

  const platforms = formData.getAll("platforms").map(String).filter(isPublishPlatform);
  if (platforms.length === 0) return { error: t("invalid") };

  const files = formData.getAll("referenceFiles").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length > MAX_REFERENCE_FILES) return { error: t("tooManyFiles") };
  if (files.reduce((total, file) => total + file.size, 0) > MAX_REFERENCE_BATCH_BYTES) return { error: t("fileBatchTooLarge") };

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
    marketArea: parsed.data.marketArea,
    productOrService: parsed.data.productOrService,
    targetAudience: parsed.data.targetAudience || null,
    highlightNotes: parsed.data.highlightNotes || null,
    platforms,
    websiteUrl: parsed.data.websiteUrl || null,
    socialHandles: parsed.data.socialHandles || null,
    languagePreference: parsed.data.languagePreference,
  });

  // 判重命中时：clientBrandName+agencyContact 都是攻击者可公开获知或猜到的字段，
  // 不能把已有申请的 viewToken（唯一访问凭证）回传给“当前这次提交”的人——否则任何人
  // 填对这两个字段就能拿到别人试做详情页的访问权限。因此命中判重直接提示已有申请，
  // 不跳转、不携带 token；也不追加这次上传的参考资料，避免堆积孤立文件。
  if (duplicate) return { error: t("duplicateExists") };

  for (const file of decoded) {
    const key = partnersRefKey(request.id, file.mime);
    try {
      await putObject(key, file.bytes);
      await addTrialReference(request.id, key, file.mime);
    } catch (error) {
      console.error("Partner trial reference storage failed", error instanceof Error ? error.name : "Unknown error");
    }
  }

  try {
    const plan = await generatePartnerTrialPlan({
      brand: parsed.data.clientBrandName,
      industry: parsed.data.industry,
      country: parsed.data.country,
      marketArea: parsed.data.marketArea,
      productOrService: parsed.data.productOrService,
      targetAudience: parsed.data.targetAudience || null,
      highlightNotes: parsed.data.highlightNotes || null,
      platforms,
      languagePreference: parsed.data.languagePreference,
    });
    if (plan) await saveTrialPlan(request.id, plan.items);
  } catch (error) {
    console.error("Partner trial plan generation failed", error instanceof Error ? error.name : "Unknown error");
  }

  redirect(`/partners/trial/${request.viewToken}`);
}

const supplementSchema = z.object({
  token: z.string().trim().min(32).max(64),
  marketArea: z.string().trim().min(1).max(128),
  productOrService: z.string().trim().min(1).max(2000),
  targetAudience: z.string().trim().max(2000),
  highlightNotes: z.string().trim().max(2000),
  websiteUrl: z.union([z.literal(""), z.string().trim().max(300).url()]),
  languagePreference: z.string().trim().min(1).max(64),
});

export async function updatePartnerTrialDetailsAction(_: FormState, formData: FormData): Promise<FormState> {
  const [t, tt] = await Promise.all([getTranslations("partners.view.errors"), getTranslations("partners.trial.errors")]);
  const parsed = supplementSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: t("invalid") };
  const trial = await getTrialRequestByToken(parsed.data.token);
  if (!trial || trial.status === "CONVERTED") return { error: t("invalid") };

  const platforms = formData.getAll("platforms").map(String).filter(isPublishPlatform);
  const selectedPlatforms = platforms.length ? platforms : trial.platforms.filter(isPublishPlatform);
  if (selectedPlatforms.length === 0) return { error: t("invalid") };

  const files = formData.getAll("referenceFiles").filter((f): f is File => f instanceof File && f.size > 0);
  if (trial.references.length + files.length > MAX_REFERENCE_FILES) return { error: tt("tooManyFiles") };
  if (files.reduce((total, file) => total + file.size, 0) > MAX_REFERENCE_BATCH_BYTES) return { error: tt("fileBatchTooLarge") };
  const decoded: { bytes: Buffer; mime: string }[] = [];
  for (const file of files) {
    const valid = validateImageBytes(Buffer.from(await file.arrayBuffer()));
    if (!valid.ok) return { error: tt(valid.error === "tooLarge" ? "fileTooLarge" : "fileBadType") };
    decoded.push({ bytes: valid.bytes, mime: valid.mime });
  }

  for (const file of decoded) {
    const key = partnersRefKey(trial.id, file.mime);
    try {
      await putObject(key, file.bytes);
      await addTrialReference(trial.id, key, file.mime);
    } catch {
      await deleteObject(key).catch(() => undefined);
      return { error: t("invalid") };
    }
  }

  await updateTrialDetails(trial.id, {
    marketArea: parsed.data.marketArea,
    productOrService: parsed.data.productOrService,
    targetAudience: parsed.data.targetAudience || null,
    highlightNotes: parsed.data.highlightNotes || null,
    websiteUrl: parsed.data.websiteUrl || null,
    platforms: selectedPlatforms,
    languagePreference: parsed.data.languagePreference,
  });

  let planUpdated = false;
  try {
    const plan = await generatePartnerTrialPlan({
      brand: trial.clientBrandName,
      industry: trial.industry,
      country: trial.country,
      marketArea: parsed.data.marketArea,
      productOrService: parsed.data.productOrService,
      targetAudience: parsed.data.targetAudience || null,
      highlightNotes: parsed.data.highlightNotes || null,
      platforms: selectedPlatforms,
      languagePreference: parsed.data.languagePreference,
    });
    if (plan) {
      await saveTrialPlan(trial.id, plan.items);
      planUpdated = true;
    }
  } catch (error) {
    console.error("Partner trial plan refresh failed", error instanceof Error ? error.name : "Unknown error");
  }
  revalidatePath(`/partners/trial/${parsed.data.token}`);
  return { ok: true, message: planUpdated ? "updatedWithPlan" : "updatedWithoutPlan" };
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
