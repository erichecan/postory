"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { assertAdmin } from "@/lib/auth/session";
import { generatePartnerTrialPlan } from "@/lib/ai/partner-trial-plan";
import { validateImageBytes } from "@/lib/ai/image-bytes";
import { grantAgencyAccess } from "@/lib/db/agency-access";
import { addTrialAsset, getTrialRequestById, markTrialConverted, markTrialDelivered, saveTrialPlan } from "@/lib/db/partner-trials";
import { createUser, findUserByEmail } from "@/lib/db/users";
import { emailSchema, nameSchema, passwordSchema, phoneSchema } from "@/lib/validation";
import { isPublishPlatform } from "@/lib/platforms";
import { deleteObject, partnersAssetKey, partnersAssetUrl, putObject } from "@/lib/storage";

const convertSchema = z.object({
  trialRequestId: z.string().min(1).max(40),
  email: emailSchema,
  phone: z.union([z.literal(""), phoneSchema]).optional(),
  name: nameSchema,
  password: passwordSchema,
  agencyEmail: z.union([z.literal(""), emailSchema]).optional(),
});

export type ConvertTrialState = { error?: string } | undefined;

export type GenerateTrialPlanState = { error?: string; ok?: boolean } | undefined;

export async function adminGenerateTrialPlanAction(_: GenerateTrialPlanState, formData: FormData): Promise<GenerateTrialPlanState> {
  await assertAdmin();
  const trialRequestId = String(formData.get("trialRequestId") ?? "");
  if (!trialRequestId || trialRequestId.length > 40) return { error: "invalid" };
  const trial = await getTrialRequestById(trialRequestId);
  if (!trial) return { error: "notFound" };
  if (trial.status === "CONVERTED") return { error: "converted" };
  try {
    const plan = await generatePartnerTrialPlan({
      brand: trial.clientBrandName,
      industry: trial.industry,
      country: trial.country,
      marketArea: trial.marketArea ?? trial.country,
      productOrService: trial.productOrService,
      targetAudience: trial.targetAudience,
      highlightNotes: trial.highlightNotes,
      platforms: trial.platforms,
      languagePreference: trial.languagePreference,
    });
    if (!plan) return { error: "unavailable" };
    await saveTrialPlan(trial.id, plan.items);
    if (trial.assets.length === 3) await markTrialDelivered(trial.id);
    revalidatePath(`/admin/partner-trials/${trial.id}`);
    revalidatePath(`/partners/trial/${trial.viewToken}`);
    return { ok: true };
  } catch {
    return { error: "unavailable" };
  }
}

export type AddTrialAssetState = { error?: string; ok?: boolean } | undefined;

export async function adminAddTrialAssetAction(_: AddTrialAssetState, formData: FormData): Promise<AddTrialAssetState> {
  await assertAdmin();
  const trialRequestId = String(formData.get("trialRequestId") ?? "");
  const caption = String(formData.get("caption") ?? "").trim().slice(0, 500);
  const trial = await getTrialRequestById(trialRequestId);
  if (!trial || trial.status === "CONVERTED") return { error: "notFound" };
  if (trial.assets.length >= 3) return { error: "limit" };
  const file = formData.get("asset");
  if (!(file instanceof File) || file.size === 0) return { error: "fileRequired" };
  const bytes = Buffer.from(await file.arrayBuffer());
  const valid = validateImageBytes(bytes);
  if (!valid.ok) return { error: valid.error === "tooLarge" ? "fileTooLarge" : "fileBadType" };
  const platforms = formData.getAll("platforms").map(String).filter(isPublishPlatform);
  const storageKey = partnersAssetKey(trial.id, valid.mime);
  try {
    await putObject(storageKey, valid.bytes);
    await addTrialAsset({
      trialRequestId: trial.id,
      storageKey,
      caption,
      platformVariants: platforms.map((platform) => ({ platform, exportedUrl: partnersAssetUrl(storageKey) })),
    });
  } catch {
    await deleteObject(storageKey).catch(() => undefined);
    return { error: "saveFailed" };
  }
  const updated = await getTrialRequestById(trial.id);
  if (updated?.assets.length === 3 && updated.planItems.length === 30) {
    await markTrialDelivered(trial.id);
  }
  revalidatePath(`/admin/partner-trials/${trial.id}`);
  revalidatePath(`/partners/trial/${trial.viewToken}`);
  return { ok: true };
}

export async function adminConvertTrialAction(_: ConvertTrialState, formData: FormData): Promise<ConvertTrialState> {
  await assertAdmin();
  const t = await getTranslations("admin.partnerTrials.errors");
  const parsed = convertSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: t("invalid") };
  const { trialRequestId, email, phone, name, password, agencyEmail } = parsed.data;

  const trial = await getTrialRequestById(trialRequestId);
  if (!trial) return { error: t("notFound") };
  if (trial.status === "CONVERTED") return { error: t("alreadyConverted") };

  let agencyUserId = trial.agencyUserId;
  if (!agencyUserId) {
    if (!agencyEmail) return { error: t("agencyEmailRequired") };
    const agencyUser = await findUserByEmail(agencyEmail);
    if (!agencyUser) return { error: t("agencyNotFound") };
    agencyUserId = agencyUser.id;
  }

  let clientUserId: string;
  try {
    const created = await createUser({ email, phone: phone || undefined, name, password, source: "OFFLINE", emailVerified: true });
    clientUserId = created.id;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return { error: t("emailTaken") };
    throw e;
  }

  await grantAgencyAccess(agencyUserId, clientUserId);
  await markTrialConverted(trialRequestId, clientUserId);

  redirect(`/admin/accounts/${clientUserId}`);
}
