import "server-only";
import { prisma } from "@/lib/db/client";

export async function listAdOpsClients(agencyUserId: string) {
  const accesses = await prisma.agencyAccess.findMany({
    where: { agencyUserId },
    orderBy: { createdAt: "desc" },
    include: {
      clientUser: {
        select: {
          id: true,
          name: true,
          email: true,
          profile: { select: { shopName: true, address: true, industry: true } },
        },
      },
    },
  });
  const profiles = await prisma.adOpsClientProfile.findMany({
    where: { agencyUserId, clientUserId: { in: accesses.map((row) => row.clientUserId) } },
    include: { platformAccounts: true, tasks: { orderBy: { updatedAt: "desc" }, take: 5 } },
  });
  const profileByClient = new Map(profiles.map((profile) => [profile.clientUserId, profile]));
  return accesses.map((access) => ({ ...access, adOpsProfile: profileByClient.get(access.clientUserId) ?? null }));
}

export async function getAgencyAdOpsClient(agencyUserId: string, clientUserId: string) {
  const access = await prisma.agencyAccess.findUnique({
    where: { agencyUserId_clientUserId: { agencyUserId, clientUserId } },
    include: {
      clientUser: {
        select: {
          id: true,
          name: true,
          email: true,
          profile: { select: { shopName: true, address: true, industry: true } },
          designs: {
            where: { exportedImageUrl: { not: null } },
            select: { id: true, title: true, caption: true, exportedImageUrl: true, createdAt: true },
            orderBy: { updatedAt: "desc" },
            take: 30,
          },
        },
      },
    },
  });
  if (!access) return null;
  const adOpsProfile = await prisma.adOpsClientProfile.findUnique({
    where: { agencyUserId_clientUserId: { agencyUserId, clientUserId } },
    include: {
      platformAccounts: { orderBy: { createdAt: "asc" } },
      tasks: { orderBy: { createdAt: "desc" }, include: { approvals: { orderBy: { requestedAt: "desc" } }, metrics: { orderBy: { periodEnd: "desc" } } } },
    },
  });
  return { ...access, adOpsProfile };
}

export async function listClientAdOpsProfiles(clientUserId: string) {
  return prisma.adOpsClientProfile.findMany({
    where: { clientUserId, agencyUser: { agencyAccessGranted: { some: { clientUserId } } } },
    include: {
      agencyUser: { select: { id: true, name: true, email: true } },
      platformAccounts: { orderBy: { createdAt: "asc" } },
      tasks: {
        orderBy: { createdAt: "desc" },
        include: {
          approvals: { orderBy: { requestedAt: "desc" } },
          metrics: { orderBy: { periodEnd: "desc" } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getAdOpsTaskForAgency(taskId: string, agencyUserId: string) {
  return prisma.adOpsPromotionTask.findFirst({
    where: { id: taskId, profile: { agencyUserId } },
    include: {
      profile: { include: { clientUser: { select: { id: true, name: true, profile: { select: { shopName: true } } } } } },
      platformAccount: true,
      approvals: { orderBy: { requestedAt: "desc" } },
      metrics: { orderBy: { periodEnd: "desc" } },
      auditEvents: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
}
