"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { assertUser } from "@/lib/auth/session";

const platforms = ["Meta", "Google", "TikTok", "Microsoft", "Reddit", "Apple Search Ads"] as const;
const offerTypes = ["WEEKDAY_BUNDLE", "OFF_PEAK", "MIN_SPEND", "COUPON"] as const;
const euro = z.coerce.number().finite().min(0).max(100_000).transform((n) => Math.round(n * 100));
const commonProfile = z.object({
  objective: z.enum(["BOOKINGS", "IN_STORE_VISITS", "ONLINE_ORDERS", "LEADS", "AWARENESS"]),
  monthlyBudget: euro,
  dailyBudget: euro,
  serviceArea: z.string().trim().min(2).max(255),
  excludedAreas: z.string().trim().max(500).optional(),
  platforms: z.array(z.enum(platforms)).min(1).max(6),
});

function value(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw : "";
}

function dateValue(input: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) return null;
  const date = new Date(`${input}T00:00:00.000Z`);
  // Date.parse normalizes impossible dates (for example February 31); reject those.
  return Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== input ? null : date;
}

async function audit(profileId: string, actorUserId: string, action: string, taskId?: string, details?: object) {
  await prisma.adOpsAuditEvent.create({
    data: { profileId, actorUserId, action, taskId, details: details ?? undefined },
  });
}

export async function saveAgencyAdOpsProfileAction(formData: FormData) {
  const user = await assertUser();
  const clientUserId = value(formData, "clientUserId");
  const parsed = commonProfile.safeParse({
    objective: value(formData, "objective"),
    monthlyBudget: value(formData, "monthlyBudget"),
    dailyBudget: value(formData, "dailyBudget"),
    serviceArea: value(formData, "serviceArea"),
    excludedAreas: value(formData, "excludedAreas"),
    platforms: formData.getAll("platforms").filter((v): v is string => typeof v === "string"),
  });
  if (!parsed.success || parsed.data.dailyBudget > parsed.data.monthlyBudget) {
    redirect(`/ad-ops/clients/${encodeURIComponent(clientUserId)}?error=profile`);
  }
  const access = await prisma.agencyAccess.findUnique({
    where: { agencyUserId_clientUserId: { agencyUserId: user.id, clientUserId } },
    select: { id: true },
  });
  if (!access) redirect("/ad-ops?error=access");
  const profileData = {
    objective: parsed.data.objective,
    monthlyBudgetMinor: parsed.data.monthlyBudget,
    dailyBudgetMinor: parsed.data.dailyBudget,
    serviceArea: parsed.data.serviceArea,
    excludedAreas: parsed.data.excludedAreas || null,
    recommendedPlatforms: parsed.data.platforms,
  };
  const profile = await prisma.adOpsClientProfile.upsert({
    where: { agencyUserId_clientUserId: { agencyUserId: user.id, clientUserId } },
    create: {
      agencyUserId: user.id,
      clientUserId,
      ...profileData,
      currency: "EUR",
      timeZone: "Europe/Dublin",
      autoRunInPolicy: false,
      clientConfirmedAt: null,
    },
    update: {
      ...profileData,
      // Any agency-side change needs the client to reconfirm the new boundary.
      autoRunInPolicy: false,
      clientConfirmedAt: null,
    },
    select: { id: true },
  });
  await audit(profile.id, user.id, "CLIENT_PROFILE_DRAFT_SAVED", undefined, { clientConfirmationRequired: true });
  revalidatePath("/ad-ops");
  revalidatePath(`/ad-ops/clients/${clientUserId}`);
  revalidatePath("/ad-ops/portal");
  redirect(`/ad-ops/clients/${clientUserId}?saved=1`);
}

export async function confirmAdOpsProfileAction(formData: FormData) {
  const user = await assertUser();
  const profileId = value(formData, "profileId");
  const profile = await prisma.adOpsClientProfile.findFirst({
    where: { id: profileId, clientUserId: user.id },
    select: { id: true, agencyUserId: true },
  });
  if (!profile) redirect("/ad-ops/portal?error=profile");
  const activeAccess = await prisma.agencyAccess.findUnique({ where: { agencyUserId_clientUserId: { agencyUserId: profile.agencyUserId, clientUserId: user.id } }, select: { id: true } });
  if (!activeAccess) redirect("/ad-ops/portal?error=profile");
  const parsed = commonProfile.safeParse({
    objective: value(formData, "objective"),
    monthlyBudget: value(formData, "monthlyBudget"),
    dailyBudget: value(formData, "dailyBudget"),
    serviceArea: value(formData, "serviceArea"),
    excludedAreas: value(formData, "excludedAreas"),
    platforms: formData.getAll("platforms").filter((v): v is string => typeof v === "string"),
  });
  if (!parsed.success || parsed.data.dailyBudget > parsed.data.monthlyBudget) {
    redirect("/ad-ops/portal?error=profile");
  }
  const approvedOfferTypes = formData.getAll("offerTypes").filter((v): v is string => typeof v === "string" && offerTypes.includes(v as typeof offerTypes[number]));
  const autoRunInPolicy = value(formData, "autoRunInPolicy") === "on";
  await prisma.adOpsClientProfile.update({
    where: { id: profile.id },
    data: {
      objective: parsed.data.objective,
      monthlyBudgetMinor: parsed.data.monthlyBudget,
      dailyBudgetMinor: parsed.data.dailyBudget,
      serviceArea: parsed.data.serviceArea,
      excludedAreas: parsed.data.excludedAreas || null,
      recommendedPlatforms: parsed.data.platforms,
      currency: "EUR",
      timeZone: "Europe/Dublin",
      approvedOfferTypes,
      autoRunInPolicy,
      clientConfirmedAt: new Date(),
    },
  });
  await audit(profile.id, user.id, "CLIENT_POLICY_CONFIRMED", undefined, { autoRunInPolicy, approvedPlatforms: parsed.data.platforms, approvedOfferTypes });
  revalidatePath("/ad-ops");
  revalidatePath("/ad-ops/portal");
  redirect("/ad-ops/portal?saved=1");
}

const taskSchema = z.object({
  title: z.string().trim().min(3).max(160),
  platform: z.enum(platforms),
  offerType: z.enum(offerTypes),
  offerTitle: z.string().trim().min(3).max(160),
  offerDetails: z.string().trim().min(8).max(5000),
  startsAt: z.string(),
  endsAt: z.string(),
  dailyBudget: euro.refine((n) => n > 0),
  destinationType: z.enum(["BOOKING", "VOUCHER", "CALL", "WEBSITE", "WALK_IN"]),
  destinationUrl: z.string().trim().max(2000).optional(),
  redemptionInstructions: z.string().trim().max(1000).optional(),
  creativeCopy: z.string().trim().min(8).max(10000),
  creativeSource: z.string().trim().max(160).optional(),
  contentDesignId: z.string().trim().max(64).optional(),
});

export async function createAdOpsTaskAction(formData: FormData) {
  const user = await assertUser();
  const clientUserId = value(formData, "clientUserId");
  const parsed = taskSchema.safeParse({
    title: value(formData, "title"),
    platform: value(formData, "platform"),
    offerType: value(formData, "offerType"),
    offerTitle: value(formData, "offerTitle"),
    offerDetails: value(formData, "offerDetails"),
    startsAt: value(formData, "startsAt"),
    endsAt: value(formData, "endsAt"),
    dailyBudget: value(formData, "dailyBudget"),
    destinationType: value(formData, "destinationType"),
    destinationUrl: value(formData, "destinationUrl"),
    redemptionInstructions: value(formData, "redemptionInstructions"),
    creativeCopy: value(formData, "creativeCopy"),
    creativeSource: value(formData, "creativeSource"),
    contentDesignId: value(formData, "contentDesignId"),
  });
  if (!parsed.success) redirect(`/ad-ops/clients/${encodeURIComponent(clientUserId)}?error=task`);
  const access = await prisma.agencyAccess.findUnique({
    where: { agencyUserId_clientUserId: { agencyUserId: user.id, clientUserId } },
    select: { id: true },
  });
  const profile = access ? await prisma.adOpsClientProfile.findUnique({
    where: { agencyUserId_clientUserId: { agencyUserId: user.id, clientUserId } },
    include: { platformAccounts: true },
  }) : null;
  if (!profile) redirect(`/ad-ops/clients/${encodeURIComponent(clientUserId)}?error=setup`);
  const start = dateValue(parsed.data.startsAt);
  const end = dateValue(parsed.data.endsAt);
  const durationDays = start && end ? Math.round((end.valueOf() - start.valueOf()) / 86_400_000) + 1 : 0;
  if (!start || !end || durationDays < 1 || durationDays > 90) redirect(`/ad-ops/clients/${clientUserId}?error=dates`);
  const dailyBudgetMinor = parsed.data.dailyBudget;
  const totalBudgetMinor = dailyBudgetMinor * durationDays;
  if (totalBudgetMinor > 10_000_000) redirect(`/ad-ops/clients/${clientUserId}?error=budget`);
  const account = profile.platformAccounts.find((item) => item.platform === parsed.data.platform && item.status === "AUTHORIZED");
  const policyReasons: string[] = [];
  if (!profile.clientConfirmedAt) policyReasons.push("客户尚未确认本客户的投放边界");
  if (!profile.autoRunInPolicy) policyReasons.push("客户尚未授权在规则范围内自动执行");
  if (!profile.recommendedPlatforms.includes(parsed.data.platform)) policyReasons.push("所选平台不在客户确认的渠道范围内");
  if (!profile.approvedOfferTypes.includes(parsed.data.offerType)) policyReasons.push("该优惠类型不在客户预先批准的范围内");
  if (dailyBudgetMinor > profile.dailyBudgetMinor || totalBudgetMinor > profile.monthlyBudgetMinor) policyReasons.push("任务预算超出客户已确认的每日或月度上限");
  const requiresApproval = policyReasons.length > 0;
  const preflightBlockers = [
    ...policyReasons,
    ...(account ? [] : ["没有客户已授权的付费广告账户；当前只能保存或运行无花费模拟"]),
  ];
  let contentDesignId: string | undefined;
  if (parsed.data.contentDesignId) {
    const design = await prisma.design.findFirst({
      where: { id: parsed.data.contentDesignId, userId: clientUserId },
      select: { id: true },
    });
    if (!design) redirect(`/ad-ops/clients/${clientUserId}?error=asset`);
    contentDesignId = design.id;
  }
  let destinationUrl: string | undefined;
  if (parsed.data.destinationUrl) {
    try {
      const url = new URL(parsed.data.destinationUrl);
      if (url.protocol !== "https:") throw new Error("https required");
      destinationUrl = url.toString();
    } catch {
      redirect(`/ad-ops/clients/${clientUserId}?error=url`);
    }
  }
  const created = await prisma.$transaction(async (tx) => {
    const task = await tx.adOpsPromotionTask.create({
      data: {
        profileId: profile.id,
        platformAccountId: account?.id,
        contentDesignId,
        title: parsed.data.title,
        objective: profile.objective,
        platform: parsed.data.platform,
        offerType: parsed.data.offerType,
        offerTitle: parsed.data.offerTitle,
        offerDetails: parsed.data.offerDetails,
        startsAt: start,
        endsAt: end,
        dailyBudgetMinor,
        totalBudgetMinor,
        serviceAreaSnapshot: profile.serviceArea,
        audienceRecommendation: `Broad local audience around ${profile.serviceArea}; platform automatic optimization. No sensitive-trait inference.`,
        creativeCopy: parsed.data.creativeCopy,
        creativeSource: parsed.data.creativeSource,
        destinationType: parsed.data.destinationType,
        destinationUrl,
        redemptionInstructions: parsed.data.redemptionInstructions,
        preflight: { blockers: preflightBlockers, paidAccountConnected: Boolean(account), simulatedOnly: !account },
        status: requiresApproval ? "NEEDS_APPROVAL" : account ? "READY" : "PREFLIGHT_BLOCKED",
        autoApproved: !requiresApproval,
        createdByUserId: user.id,
      },
    });
    if (requiresApproval) {
      await tx.adOpsTaskApproval.create({
        data: { taskId: task.id, taskVersion: task.version, reason: policyReasons.join("；"), requestedById: user.id },
      });
    }
    await tx.adOpsAuditEvent.create({
      data: {
        profileId: profile.id,
        taskId: task.id,
        actorUserId: user.id,
        action: requiresApproval ? "TASK_SENT_FOR_APPROVAL" : "TASK_PREFLIGHTED",
        details: { preflightBlockers, dailyBudgetMinor, totalBudgetMinor },
      },
    });
    return task;
  });
  revalidatePath("/ad-ops");
  revalidatePath(`/ad-ops/clients/${clientUserId}`);
  redirect(`/ad-ops/tasks/${created.id}`);
}

export async function decideAdOpsTaskAction(formData: FormData) {
  const user = await assertUser();
  const taskId = value(formData, "taskId");
  const decision = value(formData, "decision");
  if (decision !== "APPROVED" && decision !== "REJECTED" && decision !== "CHANGES_REQUESTED") redirect("/ad-ops/portal?error=decision");
  const task = await prisma.adOpsPromotionTask.findFirst({
    where: { id: taskId, profile: { clientUserId: user.id } },
    include: { profile: { include: { platformAccounts: true } }, approvals: { where: { status: "PENDING" }, orderBy: { requestedAt: "desc" }, take: 1 } },
  });
  const approval = task?.approvals[0];
  if (!task || !approval) redirect("/ad-ops/portal?error=approval");
  const account = task.profile.platformAccounts.find((a) => a.id === task.platformAccountId && a.status === "AUTHORIZED");
  const nextStatus = decision === "APPROVED" ? (account ? "READY" : "PREFLIGHT_BLOCKED") : decision === "REJECTED" ? "CANCELLED" : "DRAFT";
  await prisma.$transaction([
    prisma.adOpsTaskApproval.update({ where: { id: approval.id }, data: { status: decision, decidedById: user.id, decidedAt: new Date(), decisionNote: value(formData, "decisionNote") || undefined } }),
    prisma.adOpsPromotionTask.update({ where: { id: task.id }, data: { status: nextStatus, version: { increment: 1 } } }),
    prisma.adOpsAuditEvent.create({ data: { profileId: task.profileId, taskId: task.id, actorUserId: user.id, action: `CLIENT_${decision}`, details: { version: task.version } } }),
  ]);
  revalidatePath("/ad-ops/portal");
  revalidatePath(`/ad-ops/tasks/${task.id}`);
  redirect("/ad-ops/portal?saved=1");
}

export async function reviseAdOpsTaskAction(formData: FormData) {
  const user = await assertUser();
  const taskId = value(formData, "taskId");
  const title = z.string().trim().min(3).max(160).safeParse(value(formData, "title"));
  const offerDetails = z.string().trim().min(8).max(5000).safeParse(value(formData, "offerDetails"));
  const creativeCopy = z.string().trim().min(8).max(10000).safeParse(value(formData, "creativeCopy"));
  const dailyBudget = euro.refine((n) => n > 0).safeParse(value(formData, "dailyBudget"));
  const task = await prisma.adOpsPromotionTask.findFirst({ where: { id: taskId, profile: { agencyUserId: user.id } }, include: { profile: true, approvals: { orderBy: { requestedAt: "desc" }, take: 1 } } });
  if (!task || task.status !== "DRAFT" || task.approvals[0]?.status !== "CHANGES_REQUESTED" || !title.success || !offerDetails.success || !creativeCopy.success || !dailyBudget.success) {
    redirect(`/ad-ops/tasks/${encodeURIComponent(taskId)}?error=revision`);
  }
  const durationDays = Math.round((task.endsAt.valueOf() - task.startsAt.valueOf()) / 86_400_000) + 1;
  const totalBudgetMinor = dailyBudget.data * durationDays;
  if (totalBudgetMinor > 10_000_000) redirect(`/ad-ops/tasks/${taskId}?error=budget`);
  const updated = await prisma.$transaction(async (tx) => {
    const next = await tx.adOpsPromotionTask.update({
      where: { id: task.id },
      data: { title: title.data, offerDetails: offerDetails.data, creativeCopy: creativeCopy.data, dailyBudgetMinor: dailyBudget.data, totalBudgetMinor, version: { increment: 1 }, status: "NEEDS_APPROVAL", autoApproved: false },
    });
    await tx.adOpsTaskApproval.create({ data: { taskId, taskVersion: next.version, requestedById: user.id, reason: "运营已按客户反馈修改任务，请确认新版本。" } });
    await tx.adOpsAuditEvent.create({ data: { profileId: task.profileId, taskId, actorUserId: user.id, action: "TASK_REVISED_FOR_APPROVAL", details: { version: next.version, dailyBudgetMinor: dailyBudget.data } } });
    return next;
  });
  revalidatePath(`/ad-ops/tasks/${updated.id}`);
  revalidatePath("/ad-ops/portal");
  redirect(`/ad-ops/tasks/${updated.id}?revised=1`);
}

export async function simulateAdOpsTaskAction(formData: FormData) {
  const user = await assertUser();
  const taskId = value(formData, "taskId");
  const task = await prisma.adOpsPromotionTask.findFirst({ where: { id: taskId, profile: { agencyUserId: user.id } }, include: { profile: true, approvals: { where: { status: "PENDING" }, select: { id: true } } } });
  if (!task || task.approvals.length || !task.profile.clientConfirmedAt || !["READY", "PREFLIGHT_BLOCKED", "PAUSED", "SIMULATED_RUNNING"].includes(task.status)) redirect(`/ad-ops/tasks/${encodeURIComponent(taskId)}?error=blocked`);
  await prisma.$transaction([
    prisma.adOpsPromotionTask.update({ where: { id: task.id }, data: { status: "SIMULATED_RUNNING" } }),
    prisma.adOpsAuditEvent.create({ data: { profileId: task.profileId, taskId: task.id, actorUserId: user.id, action: "SIMULATION_STARTED", details: { makesNoPlatformCalls: true, spendsNothing: true } } }),
  ]);
  revalidatePath("/ad-ops");
  revalidatePath(`/ad-ops/tasks/${task.id}`);
  redirect(`/ad-ops/tasks/${task.id}?simulated=1`);
}

export async function pauseAdOpsTaskAction(formData: FormData) {
  const user = await assertUser();
  const taskId = value(formData, "taskId");
  const task = await prisma.adOpsPromotionTask.findFirst({ where: { id: taskId, profile: { agencyUserId: user.id } }, select: { id: true, profileId: true, status: true } });
  if (!task || task.status !== "SIMULATED_RUNNING") redirect(`/ad-ops/tasks/${encodeURIComponent(taskId)}?error=pause`);
  await prisma.$transaction([
    prisma.adOpsPromotionTask.update({ where: { id: task.id }, data: { status: "PAUSED" } }),
    prisma.adOpsAuditEvent.create({ data: { profileId: task.profileId, taskId: task.id, actorUserId: user.id, action: "SIMULATION_PAUSED", details: { makesNoPlatformCalls: true } } }),
  ]);
  revalidatePath(`/ad-ops/tasks/${task.id}`);
  revalidatePath("/ad-ops");
  redirect(`/ad-ops/tasks/${task.id}?paused=1`);
}

export async function recordAdOpsResultsAction(formData: FormData) {
  const user = await assertUser();
  const taskId = value(formData, "taskId");
  const task = await prisma.adOpsPromotionTask.findFirst({
    where: { id: taskId, OR: [{ profile: { agencyUserId: user.id } }, { profile: { clientUserId: user.id } }] },
    select: { id: true, profileId: true },
  });
  if (!task) redirect("/ad-ops/portal?error=task");
  const start = dateValue(value(formData, "periodStart"));
  const end = dateValue(value(formData, "periodEnd"));
  const spend = euro.safeParse(value(formData, "spend"));
  const salesRaw = value(formData, "sales");
  const sales = salesRaw ? euro.safeParse(salesRaw) : null;
  const integer = (key: string, max: number) => z.coerce.number().int().min(0).max(max).safeParse(value(formData, key));
  const clicks = integer("clicks", 10_000_000);
  const voucherClaims = integer("voucherClaims", 1_000_000);
  const confirmedBookings = integer("confirmedBookings", 1_000_000);
  const redemptions = integer("redemptions", 1_000_000);
  if (!start || !end || end < start || !spend.success || (sales && !sales.success) || !clicks.success || !voucherClaims.success || !confirmedBookings.success || !redemptions.success) {
    redirect(`/ad-ops/tasks/${encodeURIComponent(taskId)}?error=metrics`);
  }
  await prisma.$transaction([
    prisma.adOpsMetricSnapshot.upsert({
      where: { taskId_periodStart_periodEnd_dataSource: { taskId, periodStart: start, periodEnd: end, dataSource: "MANUAL" } },
      create: { taskId, periodStart: start, periodEnd: end, dataSource: "MANUAL", spendMinor: spend.data, salesMinor: sales?.success ? sales.data : null, clicks: clicks.data, voucherClaims: voucherClaims.data, confirmedBookings: confirmedBookings.data, redemptions: redemptions.data },
      update: { spendMinor: spend.data, salesMinor: sales?.success ? sales.data : null, clicks: clicks.data, voucherClaims: voucherClaims.data, confirmedBookings: confirmedBookings.data, redemptions: redemptions.data, syncedAt: new Date() },
    }),
    prisma.adOpsAuditEvent.create({ data: { profileId: task.profileId, taskId, actorUserId: user.id, action: "MANUAL_RESULTS_RECORDED", details: { periodStart: value(formData, "periodStart"), periodEnd: value(formData, "periodEnd"), source: "MANUAL" } } }),
  ]);
  revalidatePath(`/ad-ops/tasks/${taskId}`);
  revalidatePath("/ad-ops/portal");
  redirect(`/ad-ops/tasks/${taskId}?results=1`);
}
