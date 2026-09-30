import "server-only";
import { prisma } from "./client";
import { grantCredits, grantMany, type GrantInput } from "./credits";
import { Prisma, type PlanStatus } from "@/generated/prisma/client";

export async function getCustomerPlanRow(userId: string) {
  return prisma.customerPlan.findUnique({ where: { userId } });
}

export async function getStripeCustomerId(userId: string) {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { stripeCustomerId: true } });
  return u?.stripeCustomerId ?? null;
}

export async function saveStripeCustomerId(userId: string, customerId: string) {
  await prisma.user.updateMany({ where: { id: userId, stripeCustomerId: null }, data: { stripeCustomerId: customerId } });
  return (await getStripeCustomerId(userId)) ?? customerId;
}

export async function isEventProcessed(id: string) {
  return (await prisma.stripeEvent.count({ where: { id } })) > 0;
}

export async function markEventProcessed(id: string, type: string) {
  try {
    await prisma.stripeEvent.create({ data: { id, type } });
  } catch (err) {
    if (!(err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002")) throw err;
  }
}

export async function resolveStripeUser(ref: { userId?: string | null; customerId?: string | null; subscriptionId?: string | null }) {
  if (ref.subscriptionId) {
    const plan = await prisma.customerPlan.findUnique({ where: { stripeSubscriptionId: ref.subscriptionId }, select: { userId: true } });
    if (plan) return plan.userId;
  }
  if (ref.customerId) {
    const user = await prisma.user.findUnique({ where: { stripeCustomerId: ref.customerId }, select: { id: true } });
    if (user) return user.id;
  }
  if (ref.userId) {
    const user = await prisma.user.findUnique({ where: { id: ref.userId }, select: { id: true } });
    if (user) return user.id;
  }
  return null;
}

export async function activateStripePlan(userId: string, subscriptionId: string, currentPeriodEnd?: Date) {
  const res = await prisma.customerPlan.updateMany({
    where: { userId },
    data: { status: "ACTIVE", billing: "STRIPE", stripeSubscriptionId: subscriptionId, ...(currentPeriodEnd ? { currentPeriodEnd } : {}) },
  });
  return res.count === 1;
}

export async function recordInvoicePaid(userId: string, invoice: { id: string; subscriptionId: string; periodStart: Date; periodEnd: Date }) {
  const plan = await prisma.customerPlan.findUnique({ where: { userId }, select: { monthlyCredits: true, monthlyVideos: true } });
  if (!plan) return false;
  await activateStripePlan(userId, invoice.subscriptionId, invoice.periodEnd);
  const base = { userId, source: "MONTHLY" as const, validFrom: invoice.periodStart, expiresAt: invoice.periodEnd };
  const grants: GrantInput[] = [
    { ...base, amount: plan.monthlyCredits, refId: `invoice:${invoice.id}`, note: `stripe ${invoice.id}` },
    { ...base, unit: "VIDEO", amount: plan.monthlyVideos, refId: `invoice-video:${invoice.id}` },
  ];
  await grantMany(grants.filter((g) => g.amount > 0));
  return true;
}

export async function setStatusBySubscription(subscriptionId: string, status: PlanStatus, currentPeriodEnd?: Date) {
  const res = await prisma.customerPlan.updateMany({ where: { stripeSubscriptionId: subscriptionId }, data: { status, ...(currentPeriodEnd ? { currentPeriodEnd } : {}) } });
  return res.count > 0;
}

export const topupRef = (paymentId: string) => `topup:${paymentId}`;

export async function grantTopup(userId: string, paymentId: string, credits: number) {
  return grantCredits({ userId, source: "TOPUP", amount: credits, refId: topupRef(paymentId), note: `stripe ${paymentId}` });
}

export async function revokeTopup(paymentId: string) {
  return prisma.$transaction(async (tx) => {
    const grant = await tx.creditGrant.findUnique({ where: { refId: topupRef(paymentId) } });
    if (!grant) return 0;
    await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${grant.userId} FOR UPDATE`;
    const fresh = await tx.creditGrant.findUniqueOrThrow({ where: { id: grant.id }, select: { remaining: true } });
    if (fresh.remaining === 0) return 0;
    await tx.creditGrant.update({ where: { id: grant.id }, data: { remaining: 0 } });
    await tx.creditTxn.create({
      data: { userId: grant.userId, kind: "EXPIRE", source: "TOPUP", delta: -fresh.remaining, refId: `refund:${paymentId}`, allocations: [{ grantId: grant.id, amount: fresh.remaining }], note: `stripe refund ${paymentId}` },
    });
    return fresh.remaining;
  });
}
