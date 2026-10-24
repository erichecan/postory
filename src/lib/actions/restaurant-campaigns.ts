"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { validateImageBytes } from "@/lib/ai/image-bytes";
import { assertAdmin, assertUser } from "@/lib/auth/session";
import { addRestaurantCampaignContent, addRestaurantCampaignReference, addRestaurantMarketingPlanItem, addRestaurantPlanItemSubmission, createRestaurantCampaignBrief, decideRestaurantCampaignContent, deleteRestaurantBrief, getRestaurantBriefById, getRestaurantBriefByToken, getRestaurantBriefForClient, getRestaurantBriefForClaim, linkRestaurantBriefClient, setRestaurantBriefStatus, setRestaurantPlanItemStatus, updateRestaurantCampaignPublish, upsertRestaurantMarketingPlan } from "@/lib/db/restaurant-campaigns";
import { findUserByEmail } from "@/lib/db/users";
import { verifyPartnerReferralToken } from "@/lib/partners/referral";
import { isPublishPlatform, requiresConnection } from "@/lib/platforms";
import { deleteObject, putObject, restaurantCampaignMediaKey } from "@/lib/storage";
import { appUrl } from "@/lib/app-url";
import { listConnectedPlatforms } from "@/lib/db/social";
import { getEntitlements } from "@/lib/db/entitlements";
import { publishDesignToAyrshare } from "@/lib/db/ayrshare-publish";
import { prisma } from "@/lib/db/client";
import type { FormState } from "@/lib/validation";

const directionValues = ["new-arrival", "lunch-set", "healthy-light", "limited-offer", "seafood-feature", "premium-signature", "signature-platter", "date-night"] as const;
const goalValues = ["offer-reach", "menu-views", "offer-redemptions", "online-bookings", "dish-discovery", "local-engagement"] as const;
const featuredItemValues = ["signature-dishes", "lunch-offers", "new-seasonal", "takeaway-sharing", "events", "other"] as const;
const windowValues = ["flexible", "lunch", "evening"] as const;
const tierValues = ["starter", "growth"] as const;
const visualStyleValues = ["appetizing", "warm", "minimal", "follow-brand"] as const;
const brandVoiceValues = ["friendly", "casual", "premium", "expert"] as const;
const publishablePlatforms = ["instagram", "facebook", "tiktok"] as const;
const maxFiles = 6;
const maxFileBatch = 10 * 1024 * 1024;

const briefSchema = z.object({
  referral: z.string().max(256).optional().default(""),
  serviceTier: z.enum(tierValues).default("starter"),
  visualStyle: z.enum(visualStyleValues).default("appetizing"),
  brandVoice: z.enum(brandVoiceValues).default("friendly"),
  targetAudience: z.string().trim().max(300).default(""),
  specificOffer: z.string().trim().max(1500).default(""),
  brandReferences: z.string().trim().max(500).default(""),
  contentRestrictions: z.string().trim().max(1000).default(""),
  featuredItems: z.array(z.enum(featuredItemValues)).min(1).max(6),
  contactName: z.string().trim().min(1).max(100),
  contactEmail: z.string().trim().email().max(254),
  contactPhone: z.string().trim().max(32).optional().default(""),
  businessName: z.string().trim().min(1).max(128),
  location: z.string().trim().min(1).max(160),
  websiteUrl: z.union([z.literal(""), z.string().trim().url().max(500)]),
  campaignDirection: z.enum(directionValues),
  campaignGoal: z.enum(goalValues),
  campaignDetails: z.string().trim().min(10).max(3000),
  campaignStartDate: z.string().trim().max(10),
  campaignEndDate: z.string().trim().max(10),
  preferredPostWindow: z.enum(windowValues),
  languagePreference: z.enum(["en", "zh"]),
});

function optionalDate(value: string): Date | null | "invalid" {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "invalid";
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? "invalid" : date;
}

export async function submitRestaurantCampaignBriefAction(_: FormState, formData: FormData): Promise<FormState> {
  const rawForm = {
    ...Object.fromEntries(formData),
    featuredItems: formData.getAll("featuredItems").map(String),
  };
  const parsed = briefSchema.safeParse(rawForm);
  if (!parsed.success) return { error: "请检查必填信息，并至少选择一个主推内容。" };
  const startDate = optionalDate(parsed.data.campaignStartDate);
  const endDate = optionalDate(parsed.data.campaignEndDate);
  if (startDate === "invalid" || endDate === "invalid" || (startDate && endDate && endDate < startDate) || Boolean(startDate) !== Boolean(endDate)) {
    return { error: "请填写完整的活动起止日期，并确保结束日期不早于开始日期。" };
  }
  const platforms = [...new Set(formData.getAll("platforms").map(String).filter((value) => (publishablePlatforms as readonly string[]).includes(value) && isPublishPlatform(value)))];
  if (platforms.length === 0) return { error: "请至少选择一个发布平台。" };
  const files = formData.getAll("referenceFiles").filter((file): file is File => file instanceof File && file.size > 0);
  if (files.length > maxFiles) return { error: "参考照片最多上传 6 张。" };
  if (files.reduce((size, file) => size + file.size, 0) > maxFileBatch) return { error: "照片总大小不能超过 10 MB。" };
  const decoded: { bytes: Buffer; mime: string }[] = [];
  for (const file of files) {
    const valid = validateImageBytes(Buffer.from(await file.arrayBuffer()));
    if (!valid.ok) return { error: valid.error === "tooLarge" ? "照片文件过大。" : "请使用 PNG、JPEG 或 WebP 格式的照片。" };
    decoded.push({ bytes: valid.bytes, mime: valid.mime });
  }

  const brief = await createRestaurantCampaignBrief({
    referralUserId: verifyPartnerReferralToken(parsed.data.referral),
    contactName: parsed.data.contactName,
    contactEmail: parsed.data.contactEmail.toLowerCase(),
    contactPhone: parsed.data.contactPhone || null,
    businessName: parsed.data.businessName,
    location: parsed.data.location,
    websiteUrl: parsed.data.websiteUrl || null,
    campaignDirection: parsed.data.campaignDirection,
    campaignGoal: parsed.data.campaignGoal,
    campaignDetails: [
      `[Selected service tier: ${parsed.data.serviceTier === "growth" ? "Growth (€249/month, 30 posts)" : "Starter (€149/month, 20 posts)"}]`,
      `[Featured content: ${parsed.data.featuredItems.join(", ")}]`,
      `[Visual style: ${parsed.data.visualStyle}]`,
      `[Brand voice: ${parsed.data.brandVoice}]`,
      `[Target audience: ${parsed.data.targetAudience || "Not specified"}]`,
      parsed.data.specificOffer ? `[Specific offer: ${parsed.data.specificOffer}]` : "",
      parsed.data.brandReferences ? `[Brand references: ${parsed.data.brandReferences}]` : "",
      parsed.data.contentRestrictions ? `[Content restrictions: ${parsed.data.contentRestrictions}]` : "",
      "",
      parsed.data.campaignDetails,
    ].filter(Boolean).join("\n"),
    campaignStartDate: startDate,
    campaignEndDate: endDate,
    preferredPostWindow: parsed.data.preferredPostWindow,
    platforms,
    languagePreference: parsed.data.languagePreference,
  });

  const savedKeys: string[] = [];
  try {
    for (const file of decoded) {
      const storageKey = restaurantCampaignMediaKey(brief.id, file.mime);
      await putObject(storageKey, file.bytes);
      savedKeys.push(storageKey);
      await addRestaurantCampaignReference({ briefId: brief.id, storageKey, mimeType: file.mime });
    }
  } catch {
    await Promise.all(savedKeys.map((key) => deleteObject(key).catch(() => undefined)));
    await deleteRestaurantBrief(brief.id).catch(() => undefined);
    return { error: "暂时无法保存你的需求，请稍后重试。" };
  }

  redirect(`/restaurant/request/${brief.token}`);
}

export async function adminAddRestaurantCampaignContentAction(_: FormState, formData: FormData): Promise<FormState> {
  await assertAdmin();
  const briefId = String(formData.get("briefId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const caption = String(formData.get("caption") ?? "").trim();
  const scheduledValue = String(formData.get("scheduledAt") ?? "");
  const planItemIdRaw = String(formData.get("planItemId") ?? "");
  const file = formData.get("asset");
  const brief = await getRestaurantBriefById(briefId);
  if (!brief || !(file instanceof File) || !file.size) return { error: "missing" };
  if (!title || title.length > 128 || !caption || caption.length > 5000) return { error: "missing" };
  const valid = validateImageBytes(Buffer.from(await file.arrayBuffer()));
  if (!valid.ok) return { error: valid.error === "tooLarge" ? "fileTooLarge" : "fileBadType" };
  const platforms = [...new Set(formData.getAll("platforms").map(String).filter((value) => brief.platforms.includes(value) && isPublishPlatform(value)))];
  if (platforms.length === 0) return { error: "missing" };
  const scheduledAt = scheduledValue ? new Date(scheduledValue) : null;
  if (scheduledValue && (!scheduledAt || Number.isNaN(scheduledAt.getTime()) || scheduledAt.getTime() <= Date.now() + 60_000)) return { error: "scheduleInvalid" };
  const planItemId = planItemIdRaw || null;
  if (planItemId && !brief.marketingPlan?.items.some((item) => item.id === planItemId)) return { error: "planItemNotFound" };
  const storageKey = restaurantCampaignMediaKey(brief.id, valid.mime);
  try {
    await putObject(storageKey, valid.bytes);
    await addRestaurantCampaignContent({ briefId, title, caption, storageKey, mimeType: valid.mime, platforms, scheduledAt, planItemId });
  } catch {
    await deleteObject(storageKey).catch(() => undefined);
    return { error: "saveFailed" };
  }
  revalidatePath(`/admin/restaurant-requests/${brief.id}`);
  revalidatePath(`/restaurant/request/${brief.token}`);
  return { ok: true };
}

export async function decideRestaurantCampaignContentAction(_: FormState, formData: FormData): Promise<FormState> {
  const token = String(formData.get("token") ?? "");
  const contentId = String(formData.get("contentId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const note = String(formData.get("revisionNote") ?? "").trim();
  if ((token && !/^[a-f0-9]{48}$/.test(token)) || !contentId || contentId.length > 40) return { error: "This review link is invalid." };
  if (decision !== "APPROVED" && decision !== "REVISION_REQUESTED") return { error: "Choose approve or request a change." };
  if (decision === "REVISION_REQUESTED" && (note.length < 5 || note.length > 2000)) return { error: "Please describe the change in at least 5 characters." };
  const brief = token
    ? await getRestaurantBriefByToken(token)
    : await (async () => {
        const user = await assertUser();
        const owned = await prisma.restaurantCampaignContent.findFirst({ where: { id: contentId, brief: { clientUserId: user.id } }, select: { brief: { select: { id: true, token: true } } } });
        return owned?.brief ?? null;
      })();
  if (!brief) return { error: "This review link is invalid." };
  const ok = await decideRestaurantCampaignContent({ id: contentId, briefId: brief.id, status: decision, revisionNote: decision === "REVISION_REQUESTED" ? note : null });
  if (!ok) return { error: "This content is no longer waiting for your review." };
  revalidatePath(`/restaurant/request/${token}`);
  revalidatePath(`/admin/restaurant-requests/${brief.id}`);
  return { ok: true };
}

export async function submitRestaurantPlanItemInfoAction(_: FormState, formData: FormData): Promise<FormState> {
  const user = await assertUser();
  const briefId = String(formData.get("briefId") ?? "");
  const planId = String(formData.get("planId") ?? "");
  const planItemIdValue = String(formData.get("planItemId") ?? "");
  const date = optionalDate(String(formData.get("date") ?? ""));
  const note = String(formData.get("note") ?? "").trim();
  if (!(date instanceof Date) || note.length > 5000) return { error: "Please check the date and keep your note under 5,000 characters." };
  const brief = await getRestaurantBriefForClient(briefId, user.id);
  if (!brief?.marketingPlan || brief.marketingPlan.id !== planId) return { error: "This restaurant plan could not be found." };
  if (date < brief.marketingPlan.startDate || date > brief.marketingPlan.endDate) return { error: "Choose a date inside your marketing plan." };
  const planItemId = planItemIdValue || null;
  if (planItemId && !brief.marketingPlan.items.some((item) => item.id === planItemId && item.date.toISOString().slice(0, 10) === date.toISOString().slice(0, 10))) return { error: "That calendar item is no longer available." };
  const files = formData.getAll("referenceFiles").filter((file): file is File => file instanceof File && file.size > 0);
  if (files.length > maxFiles) return { error: "Upload up to 6 reference photos." };
  if (files.reduce((sum, file) => sum + file.size, 0) > maxFileBatch) return { error: "The combined photo size must be 10 MB or less." };
  const decoded: { bytes: Buffer; mime: string }[] = [];
  for (const file of files) {
    const valid = validateImageBytes(Buffer.from(await file.arrayBuffer()));
    if (!valid.ok) return { error: valid.error === "tooLarge" ? "A photo is too large." : "Use PNG, JPEG, or WebP photos." };
    decoded.push({ bytes: valid.bytes, mime: valid.mime });
  }
  if (!note && decoded.length === 0) return { error: "Add a note or upload at least one reference photo." };
  const refs = decoded.map((file) => ({ briefId, storageKey: restaurantCampaignMediaKey(briefId, file.mime), mimeType: file.mime, bytes: file.bytes }));
  try {
    for (const ref of refs) await putObject(ref.storageKey, ref.bytes);
    await addRestaurantPlanItemSubmission({ planId, planItemId, date, clientUserId: user.id, note: note || null, references: refs.map(({ briefId: ownerId, storageKey, mimeType }) => ({ briefId: ownerId, storageKey, mimeType })) });
  } catch {
    await Promise.all(refs.map((ref) => deleteObject(ref.storageKey).catch(() => undefined)));
    return { error: "We couldn’t send that information. Please try again." };
  }
  revalidatePath(`/restaurant/campaigns/${briefId}`);
  revalidatePath(`/admin/restaurant-requests/${briefId}`);
  return { ok: true, message: "Sent to your PoStory team." };
}

export async function adminLinkRestaurantBriefClientAction(_: FormState, formData: FormData): Promise<FormState> {
  await assertAdmin();
  const briefId = String(formData.get("briefId") ?? "");
  const email = z.string().trim().email().max(254).safeParse(formData.get("email"));
  if (!email.success) return { error: "invalidEmail" };
  const brief = await getRestaurantBriefById(briefId);
  if (!brief) return { error: "notFound" };
  const user = await findUserByEmail(email.data);
  if (!user || user.disabled || !user.emailVerifiedAt) return { error: "clientAccountNotFound" };
  await linkRestaurantBriefClient(brief.id, user.id, brief.referralUserId);
  revalidatePath(`/admin/restaurant-requests/${brief.id}`);
  revalidatePath("/partners/clients");
  return { ok: true };
}

export async function adminPublishRestaurantCampaignContentAction(_: FormState, formData: FormData): Promise<FormState> {
  await assertAdmin();
  const contentId = String(formData.get("contentId") ?? "");
  const parsedId = z.string().min(1).max(40).safeParse(contentId);
  if (!parsedId.success) return { error: "notFound" };
  const content = await prisma.restaurantCampaignContent.findUnique({ where: { id: parsedId.data }, include: { brief: { select: { id: true, token: true, clientUserId: true, businessName: true } } } });
  if (!content || content.status !== "APPROVED" || !content.brief.clientUserId) return { error: "notReady" };
  const userId = content.brief.clientUserId;
  const entitlements = await getEntitlements(userId);
  if (!entitlements.hasActivePlan) return { error: "clientPlanRequired" };
  if (content.platforms.some((platform) => !entitlements.allowedPlatforms.includes(platform))) return { error: "platformNotAllowed" };
  if (!content.platforms.every(requiresConnection)) return { error: "platformUnsupported" };
  const connected = new Set(await listConnectedPlatforms(userId));
  if (content.platforms.some((platform) => !connected.has(platform))) return { error: "socialAccountRequired" };
  const scheduledAt = content.scheduledAt && content.scheduledAt.getTime() > Date.now() + 60_000 ? content.scheduledAt : null;
  if (!scheduledAt) return { error: "scheduleRequired" };
  const outcome = await publishDesignToAyrshare({
    userId,
    caption: content.caption,
    mediaUrl: `${appUrl()}/api/restaurant-campaign-media/${content.storageKey}`,
    platforms: content.platforms as Parameters<typeof publishDesignToAyrshare>[0]["platforms"],
    scheduledAt,
  });
  const status = outcome.publishStatus === "SUCCESS" ? "SCHEDULED" : "FAILED";
  await updateRestaurantCampaignPublish({ id: content.id, status, publishStatus: outcome.publishStatus, publishError: outcome.publishError, providerPostId: outcome.ayrsharePostId ?? null, publishedAt: null });
  if (content.planItemId) await setRestaurantPlanItemStatus(content.planItemId, outcome.publishStatus === "SUCCESS" ? "SCHEDULED" : "FAILED");
  revalidatePath(`/admin/restaurant-requests/${content.brief.id}`);
  revalidatePath(`/restaurant/request/${content.brief.token}`);
  return outcome.publishStatus === "SUCCESS" ? { ok: true } : { error: "publishFailed" };
}

export async function adminSetRestaurantBriefStatusAction(_: FormState, formData: FormData): Promise<FormState> {
  await assertAdmin();
  const briefId = String(formData.get("briefId") ?? "");
  const status = String(formData.get("status") ?? "");
  const notes = String(formData.get("internalNotes") ?? "").trim().slice(0, 5000);
  const allowed = ["SUBMITTED", "IN_REVIEW", "IN_PRODUCTION", "ACTIVE", "CLOSED"] as const;
  if (!allowed.includes(status as (typeof allowed)[number])) return { error: "invalidStatus" };
  const brief = await setRestaurantBriefStatus(briefId, status as (typeof allowed)[number], notes);
  revalidatePath(`/admin/restaurant-requests/${brief.id}`);
  revalidatePath(`/restaurant/request/${brief.token}`);
  return { ok: true };
}

export async function claimRestaurantCampaignAction(_: FormState, formData: FormData): Promise<FormState> {
  const user = await assertUser();
  const token = String(formData.get("token") ?? "");
  if (!/^[a-f0-9]{48}$/.test(token)) return { error: "This request link is invalid." };
  if (!user.email || !user.emailVerifiedAt) redirect(`/verify-email?next=${encodeURIComponent(`/restaurant/request/${token}/claim`)}`);
  const brief = await getRestaurantBriefForClaim(token);
  if (!brief || brief.contactEmail.toLowerCase() !== user.email.toLowerCase()) return { error: "Sign in with the verified email address you supplied with the restaurant request." };
  if (brief.clientUserId && brief.clientUserId !== user.id) return { error: "This restaurant request is already linked to another account." };
  if (!brief.clientUserId) await linkRestaurantBriefClient(brief.id, user.id, brief.referralUserId);
  redirect(`/restaurant/campaigns/${brief.id}`);
}

export async function adminSaveRestaurantMarketingPlanAction(_: FormState, formData: FormData): Promise<FormState> {
  await assertAdmin();
  const briefId = String(formData.get("briefId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const overview = String(formData.get("overview") ?? "").trim();
  const cadence = String(formData.get("cadence") ?? "").trim();
  const start = optionalDate(String(formData.get("startDate") ?? ""));
  const end = optionalDate(String(formData.get("endDate") ?? ""));
  if (!title || title.length > 160 || !overview || overview.length > 10000 || !cadence || cadence.length > 160 || !(start instanceof Date) || !(end instanceof Date) || end < start) return { error: "invalidPlan" };
  if (!(await getRestaurantBriefById(briefId))) return { error: "notFound" };
  await upsertRestaurantMarketingPlan({ briefId, title, overview, startDate: start, endDate: end, cadence });
  revalidatePath(`/admin/restaurant-requests/${briefId}`);
  revalidatePath(`/restaurant/campaigns/${briefId}`);
  return { ok: true };
}

export async function adminAddRestaurantMarketingPlanItemAction(_: FormState, formData: FormData): Promise<FormState> {
  await assertAdmin();
  const briefId = String(formData.get("briefId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const theme = String(formData.get("theme") ?? "").trim();
  const objective = String(formData.get("objective") ?? "").trim();
  const concept = String(formData.get("concept") ?? "").trim();
  const scheduledTimeRaw = String(formData.get("scheduledTime") ?? "").trim();
  const date = optionalDate(String(formData.get("date") ?? ""));
  const brief = await getRestaurantBriefById(briefId);
  if (!brief?.marketingPlan || !(date instanceof Date) || !title || title.length > 160 || !theme || theme.length > 160 || !objective || objective.length > 2000 || !concept || concept.length > 5000) return { error: "invalidPlanItem" };
  if (date < brief.marketingPlan.startDate || date > brief.marketingPlan.endDate) return { error: "dateOutsidePlan" };
  if (scheduledTimeRaw && !/^([01]\d|2[0-3]):[0-5]\d$/.test(scheduledTimeRaw)) return { error: "invalidTime" };
  const platforms = [...new Set(formData.getAll("platforms").map(String).filter((value) => brief.platforms.includes(value) && isPublishPlatform(value)))];
  if (!platforms.length) return { error: "missingPlatforms" };
  await addRestaurantMarketingPlanItem({ planId: brief.marketingPlan.id, date, scheduledTime: scheduledTimeRaw || null, title, theme, objective, concept, platforms });
  revalidatePath(`/admin/restaurant-requests/${briefId}`);
  revalidatePath(`/restaurant/campaigns/${briefId}`);
  return { ok: true };
}

export async function adminAddRestaurantCampaignContentFormAction(formData: FormData): Promise<void> { await adminAddRestaurantCampaignContentAction(undefined, formData); }
export async function adminLinkRestaurantBriefClientFormAction(formData: FormData): Promise<void> { await adminLinkRestaurantBriefClientAction(undefined, formData); }
export async function adminPublishRestaurantCampaignContentFormAction(formData: FormData): Promise<void> { await adminPublishRestaurantCampaignContentAction(undefined, formData); }
export async function adminSetRestaurantBriefStatusFormAction(formData: FormData): Promise<void> { await adminSetRestaurantBriefStatusAction(undefined, formData); }
export async function decideRestaurantCampaignContentFormAction(formData: FormData): Promise<void> { await decideRestaurantCampaignContentAction(undefined, formData); }
export async function adminSaveRestaurantMarketingPlanFormAction(formData: FormData): Promise<void> { await adminSaveRestaurantMarketingPlanAction(undefined, formData); }
export async function adminAddRestaurantMarketingPlanItemFormAction(formData: FormData): Promise<void> { await adminAddRestaurantMarketingPlanItemAction(undefined, formData); }
export async function claimRestaurantCampaignFormAction(_: FormState, formData: FormData): Promise<FormState> { return claimRestaurantCampaignAction(undefined, formData); }
