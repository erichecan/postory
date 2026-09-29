"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { assertAdmin } from "@/lib/auth/session";
import { FEATURE_IDS } from "@/lib/billing/tier-features";
import { activateOffline, cancelCustomerPlan, saveCustomerPlan, saveTier } from "@/lib/db/admin-customers";
import { deductCredits, grantCredits } from "@/lib/db/credits";
import { EXTRA_PUBLISH_PLATFORMS } from "@/lib/platforms";

type Result = { ok: boolean; error?: string };

const id = z.string().min(1).max(40);
const cents = z.number().int().min(0).max(10_000_000);
const count = z.number().int().min(0).max(100_000);

const planSchema = z.object({
  tierId: id,
  currency: z.enum(["EUR", "CAD"]),
  baseFee: cents,
  extraPlatforms: z.array(z.enum(EXTRA_PUBLISH_PLATFORMS)).max(EXTRA_PUBLISH_PLATFORMS.length).transform((v) => [...new Set(v)]),
  extraPlatformFee: cents,
  allInclusiveFee: cents.nullable(),
  monthlyCredits: count,
  monthlyVideos: count,
  topupUnitPrice: cents.min(1),
});

async function fail(): Promise<Result> {
  return { ok: false, error: (await getTranslations("admin.customer"))("invalid") };
}

function refresh(userId: string) {
  revalidatePath(`/admin/accounts/${userId}`);
  revalidatePath("/admin/accounts");
}

export async function adminSavePlanAction(userId: string, input: unknown): Promise<Result> {
  await assertAdmin();
  const uid = id.safeParse(userId);
  const parsed = planSchema.safeParse(input);
  if (!uid.success || !parsed.success) return fail();
  await saveCustomerPlan(uid.data, parsed.data);
  refresh(uid.data);
  return { ok: true };
}

export async function adminCancelPlanAction(userId: string): Promise<Result> {
  await assertAdmin();
  const uid = id.safeParse(userId);
  if (!uid.success) return fail();
  await cancelCustomerPlan(uid.data);
  refresh(uid.data);
  return { ok: true };
}

export async function adminActivateOfflineAction(userId: string, months: unknown): Promise<Result> {
  const admin = await assertAdmin();
  const uid = id.safeParse(userId);
  const n = z.number().int().min(1).max(24).safeParse(months);
  if (!uid.success || !n.success) return fail();
  const res = await activateOffline(uid.data, n.data, admin.id);
  if (!res) return { ok: false, error: (await getTranslations("admin.customer"))("needPlan") };
  refresh(uid.data);
  return { ok: true };
}

export async function adminAdjustCreditsAction(userId: string, input: unknown): Promise<Result> {
  const admin = await assertAdmin();
  const uid = id.safeParse(userId);
  const parsed = z.object({ amount: z.number().int().min(-100_000).max(100_000).refine((v) => v !== 0), reason: z.string().trim().min(1).max(255) }).safeParse(input);
  if (!uid.success || !parsed.success) return fail();
  const { amount, reason } = parsed.data;
  if (amount > 0) {
    await grantCredits({ userId: uid.data, source: "ADMIN", amount, note: reason, actorId: admin.id });
  } else {
    const res = await deductCredits(uid.data, -amount, `adjust:${randomBytes(8).toString("hex")}`, reason, admin.id);
    if (!res.ok) return { ok: false, error: (await getTranslations("admin.customer"))("insufficient", { have: res.have }) };
  }
  refresh(uid.data);
  return { ok: true };
}

const featureValue = z.union([z.boolean(), z.number().int().min(0).max(100_000), z.enum(["custom", "addon", "all"])]);
const featureShape = Object.fromEntries(FEATURE_IDS.map((fid) => [fid, featureValue])) as Record<string, typeof featureValue>;
const lines = z.array(z.string().trim().min(1).max(120)).max(12);
const short = z.string().trim().min(1).max(64);

const tierSchema = z.object({
  nameZh: short,
  nameEn: short,
  taglineZh: short,
  taglineEn: short,
  benefitsZh: lines,
  benefitsEn: lines,
  features: z.object(featureShape).strict(),
  defaultMonthlyCredits: count,
  defaultMonthlyVideos: count,
  referenceFee: cents,
  recommended: z.boolean(),
  visible: z.boolean(),
  sortOrder: z.number().int().min(0).max(100),
});

export async function adminSaveTierAction(tierId: string, input: unknown): Promise<Result> {
  await assertAdmin();
  const tid = id.safeParse(tierId);
  const parsed = tierSchema.safeParse(input);
  if (!tid.success || !parsed.success) return fail();
  await saveTier(tid.data, parsed.data as Parameters<typeof saveTier>[1]);
  revalidatePath("/admin/tiers");
  revalidatePath("/plans");
  return { ok: true };
}
