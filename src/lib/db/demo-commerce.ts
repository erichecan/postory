import "server-only";
import { prisma } from "./client";
import { grantMany } from "./credits";

const DEMO_TIER_SLUG = "basic";
const DEMO_MONTHLY_CREDITS = 200;
const DEMO_MONTHLY_VIDEOS = 4;

function monthWindow(now: Date) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return { start, end, key: start.toISOString().slice(0, 7) };
}

export async function ensureDemoCommerce(userId: string, now = new Date()) {
  const tier = await prisma.membershipTier.findUnique({ where: { slug: DEMO_TIER_SLUG }, select: { id: true } });
  if (!tier) return;
  const { start, end, key } = monthWindow(now);
  await prisma.customerPlan.upsert({
    where: { userId },
    create: {
      userId,
      tierId: tier.id,
      currency: "EUR",
      billing: "OFFLINE",
      baseFee: 9900,
      extraPlatforms: ["x", "youtube"],
      extraPlatformFee: 3000,
      monthlyCredits: DEMO_MONTHLY_CREDITS,
      monthlyVideos: DEMO_MONTHLY_VIDEOS,
      status: "ACTIVE",
      currentPeriodEnd: end,
    },
    update: { currentPeriodEnd: end, status: "ACTIVE" },
  });
  await grantMany([
    { userId, source: "MONTHLY", amount: DEMO_MONTHLY_CREDITS, validFrom: start, expiresAt: end, refId: `demo-monthly-${userId}-${key}` },
    { userId, source: "MONTHLY", unit: "VIDEO", amount: DEMO_MONTHLY_VIDEOS, validFrom: start, expiresAt: end, refId: `demo-video-${userId}-${key}` },
  ]);
}
