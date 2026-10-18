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
