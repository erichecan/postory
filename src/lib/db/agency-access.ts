import "server-only";
import { prisma } from "./client";

export async function hasAgencyAccess(agencyUserId: string, clientUserId: string): Promise<boolean> {
  const row = await prisma.agencyAccess.findUnique({
    where: { agencyUserId_clientUserId: { agencyUserId, clientUserId } },
    select: { id: true },
  });
  return row !== null;
}

export async function grantAgencyAccess(agencyUserId: string, clientUserId: string) {
  return prisma.agencyAccess.upsert({
    where: { agencyUserId_clientUserId: { agencyUserId, clientUserId } },
    create: { agencyUserId, clientUserId },
    update: {},
    select: { id: true },
  });
}

export type AgencyClientSummary = {
  clientUserId: string;
  clientName: string;
  grantedAt: Date;
};

export async function listAgencyClients(agencyUserId: string): Promise<AgencyClientSummary[]> {
  const rows = await prisma.agencyAccess.findMany({
    where: { agencyUserId },
    orderBy: { createdAt: "desc" },
    select: { clientUserId: true, createdAt: true, clientUser: { select: { name: true } } },
  });
  return rows.map((r) => ({ clientUserId: r.clientUserId, clientName: r.clientUser.name, grantedAt: r.createdAt }));
}

export type AgencyClientOverview = AgencyClientSummary & {
  shopName: string | null;
  platforms: string[];
  contentCountThisMonth: number;
};

export async function hasAnyAgencyAccess(agencyUserId: string): Promise<boolean> {
  const row = await prisma.agencyAccess.findFirst({ where: { agencyUserId }, select: { id: true } });
  return row !== null;
}

// 三条批量查询（客户数、各客户平台、本月产出数）不随客户数量线性增长调用次数，避免在客户汇总页里按客户循环查询。
export async function listAgencyClientOverviews(agencyUserId: string): Promise<AgencyClientOverview[]> {
  const clients = await listAgencyClients(agencyUserId);
  if (clients.length === 0) return [];
  const clientIds = clients.map((c) => c.clientUserId);
  const monthStart = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1));
  const [profiles, accounts, designCounts] = await Promise.all([
    prisma.brandProfile.findMany({ where: { userId: { in: clientIds } }, select: { userId: true, shopName: true } }),
    prisma.socialAccount.findMany({ where: { userId: { in: clientIds }, connectedAt: { not: null } }, select: { userId: true, platform: true } }),
    prisma.design.groupBy({
      by: ["userId"],
      where: { userId: { in: clientIds }, createdAt: { gte: monthStart } },
      _count: { _all: true },
    }),
  ]);
  const shopNameByUser = new Map(profiles.map((p) => [p.userId, p.shopName]));
  const platformsByUser = new Map<string, string[]>();
  for (const a of accounts) platformsByUser.set(a.userId, [...(platformsByUser.get(a.userId) ?? []), a.platform]);
  const countByUser = new Map(designCounts.map((d) => [d.userId, d._count._all]));
  return clients.map((c) => ({
    ...c,
    shopName: shopNameByUser.get(c.clientUserId) ?? null,
    platforms: platformsByUser.get(c.clientUserId) ?? [],
    contentCountThisMonth: countByUser.get(c.clientUserId) ?? 0,
  }));
}
