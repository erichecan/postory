import "server-only";
import { randomBytes } from "node:crypto";
import { revalidateTag } from "next/cache";
import { prisma } from "./client";
import { grantMany, type GrantInput } from "./credits";
import type { Currency, Prisma } from "@/generated/prisma/client";
import type { Locale } from "@/i18n/config";
import type { TierFeatures } from "@/lib/billing/tier-features";

export const CUSTOMERS_PER_PAGE = 24;

export async function listCustomers(page: number, now = new Date()) {
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * CUSTOMERS_PER_PAGE,
      take: CUSTOMERS_PER_PAGE,
      select: {
        id: true,
        phone: true,
        email: true,
        name: true,
        role: true,
        source: true,
        disabled: true,
        createdAt: true,
        plan: { select: { status: true, billing: true, tier: { select: { nameZh: true, nameEn: true } } } },
        _count: { select: { designs: true } },
      },
    }),
    prisma.user.count(),
  ]);
  const sums = await prisma.creditGrant.groupBy({
    by: ["userId"],
    where: { userId: { in: users.map((u) => u.id) }, unit: "CREDIT", validFrom: { lte: now }, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
    _sum: { remaining: true },
  });
  const balance = new Map(sums.map((s) => [s.userId, s._sum.remaining ?? 0]));
  return {
    items: users.map((u) => ({ ...u, balance: balance.get(u.id) ?? 0 })),
    pageCount: Math.max(1, Math.ceil(total / CUSTOMERS_PER_PAGE)),
    total,
  };
}

export type CustomerListItem = Awaited<ReturnType<typeof listCustomers>>["items"][number];

export async function getCustomer(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      disabled: true,
      createdAt: true,
      profile: { select: { shopName: true } },
      plan: true,
    },
  });
}

export async function listCustomerTxns(userId: string, take = 50) {
  return prisma.creditTxn.findMany({
    where: { userId, createdAt: { lte: new Date() } },
    orderBy: { createdAt: "desc" },
    take,
    select: { id: true, kind: true, charge: true, source: true, delta: true, note: true, createdAt: true },
  });
}

export type PlanInput = {
  tierId: string;
  currency: Currency;
  baseFee: number;
  extraPlatforms: string[];
  extraPlatformFee: number;
  allInclusiveFee: number | null;
  monthlyCredits: number;
  monthlyVideos: number;
  topupUnitPrice: number;
};

export async function saveCustomerPlan(userId: string, input: PlanInput) {
  const existing = await prisma.customerPlan.findUnique({ where: { userId }, select: { status: true } });
  const keepStatus = existing && (existing.status === "ACTIVE" || existing.status === "PAST_DUE");
  return prisma.customerPlan.upsert({
    where: { userId },
    create: { userId, ...input, status: "PENDING_PAYMENT", billing: "STRIPE" },
    update: { ...input, ...(keepStatus ? {} : { status: "PENDING_PAYMENT", billing: "STRIPE" }) },
    select: { status: true, billing: true, stripeSubscriptionId: true },
  });
}

export async function cancelCustomerPlan(userId: string) {
  const plan = await prisma.customerPlan.findUnique({ where: { userId }, select: { billing: true, status: true, stripeSubscriptionId: true } });
  await prisma.customerPlan.updateMany({ where: { userId }, data: { status: "CANCELED" } });
  return plan?.billing === "STRIPE" && plan.status !== "CANCELED" ? plan.stripeSubscriptionId : null;
}

function addMonths(d: Date, n: number) {
  const r = new Date(d);
  r.setUTCMonth(r.getUTCMonth() + n);
  return r;
}

export async function activateOffline(userId: string, months: number, actorId: string, now = new Date()) {
  const plan = await prisma.customerPlan.findUnique({ where: { userId } });
  if (!plan) return null;
  const extending = plan.billing === "OFFLINE" && plan.status === "ACTIVE" && plan.currentPeriodEnd && plan.currentPeriodEnd > now;
  const start = extending && plan.currentPeriodEnd ? plan.currentPeriodEnd : now;
  const batch = randomBytes(6).toString("hex");
  const grants: GrantInput[] = [];
  for (let i = 0; i < months; i++) {
    const validFrom = addMonths(start, i);
    const expiresAt = addMonths(start, i + 1);
    grants.push({ userId, source: "MONTHLY", amount: plan.monthlyCredits, validFrom, expiresAt, refId: `offline:${batch}:${i}`, note: `offline ${months}m`, actorId });
    if (plan.monthlyVideos > 0) {
      grants.push({ userId, source: "MONTHLY", unit: "VIDEO", amount: plan.monthlyVideos, validFrom, expiresAt, refId: `offline-video:${batch}:${i}` });
    }
  }
  const end = addMonths(start, months);
  await prisma.customerPlan.update({ where: { userId }, data: { billing: "OFFLINE", status: "ACTIVE", currentPeriodEnd: end } });
  await grantMany(grants.filter((g) => g.amount > 0));
  return { start, end };
}

export async function listAllTiers() {
  return prisma.membershipTier.findMany({ orderBy: { sortOrder: "asc" } });
}

export type TierInput = {
  nameZh: string;
  nameEn: string;
  taglineZh: string;
  taglineEn: string;
  benefitsZh: string[];
  benefitsEn: string[];
  features: TierFeatures;
  defaultMonthlyCredits: number;
  defaultMonthlyVideos: number;
  referenceFee: number;
  recommended: boolean;
  visible: boolean;
  sortOrder: number;
};

export async function saveTier(id: string, input: TierInput) {
  const data = { ...input, features: input.features as unknown as Prisma.InputJsonValue };
  const updated = await prisma.$transaction(async (tx) => {
    if (input.recommended) await tx.membershipTier.updateMany({ where: { id: { not: id } }, data: { recommended: false } });
    return tx.membershipTier.update({ where: { id }, data, select: { id: true } });
  });
  revalidateTag("tiers", "max");
  return updated;
}

export function tierName(tier: { nameZh: string; nameEn: string }, locale: Locale) {
  return locale === "zh" ? tier.nameZh : tier.nameEn;
}
