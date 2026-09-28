import "server-only";
import { prisma } from "./client";
import { Prisma } from "@/generated/prisma/client";
import type { DesignPage } from "@/types/design";

export async function createDesignFromTemplate(userId: string, templateId: string) {
  const t = await prisma.template.findUnique({ where: { id: templateId }, select: { id: true, title: true, pages: true } });
  if (!t) return null;
  return prisma.design.create({
    data: { userId, templateId: t.id, title: t.title.slice(0, 128), pages: t.pages as Prisma.InputJsonValue },
    select: { id: true },
  });
}

export async function getOwnDesign(userId: string, id: string) {
  const d = await prisma.design.findFirst({
    where: { id, userId },
    include: { template: { select: { id: true, title: true, editable: true, platform: true } } },
  });
  return d ? { ...d, pages: d.pages as unknown as DesignPage[] } : null;
}

export async function updateOwnDesign(
  userId: string,
  id: string,
  data: { pages?: DesignPage[]; title?: string; platforms?: string[]; scheduledAt?: Date | null; status?: "DRAFT" | "SCHEDULED" },
) {
  const { pages, ...rest } = data;
  const res = await prisma.design.updateMany({
    where: { id, userId },
    data: { ...rest, ...(pages ? { pages: pages as unknown as Prisma.InputJsonValue } : {}) },
  });
  return res.count === 1;
}

export async function deleteOwnDesign(userId: string, id: string) {
  const res = await prisma.design.deleteMany({ where: { id, userId } });
  return res.count === 1;
}

export const DESIGNS_PER_PAGE = 24;

export type DesignListItem = {
  id: string;
  title: string;
  status: "DRAFT" | "SCHEDULED";
  platforms: string[];
  scheduledAt: Date | null;
  updatedAt: Date;
  cover: DesignPage;
};

function listDesigns(userId: string, status: "DRAFT" | "SCHEDULED", page: number) {
  const order = status === "SCHEDULED" ? Prisma.sql`"scheduledAt" ASC` : Prisma.sql`"updatedAt" DESC`;
  return prisma.$queryRaw<DesignListItem[]>`
    SELECT id, title, status::text AS status, platforms, "scheduledAt", "updatedAt", pages->0 AS cover
    FROM "Design"
    WHERE "userId" = ${userId} AND status = ${status}::"DesignStatus"
    ORDER BY ${order}
    LIMIT ${DESIGNS_PER_PAGE} OFFSET ${(page - 1) * DESIGNS_PER_PAGE}`;
}

export async function listOwnDesigns(userId: string, draftPage = 1) {
  const [scheduled, drafts, scheduledTotal, draftTotal] = await prisma.$transaction([
    listDesigns(userId, "SCHEDULED", 1),
    listDesigns(userId, "DRAFT", draftPage),
    prisma.design.count({ where: { userId, status: "SCHEDULED" } }),
    prisma.design.count({ where: { userId, status: "DRAFT" } }),
  ]);
  return {
    scheduled,
    drafts,
    scheduledTotal,
    draftTotal,
    draftPageCount: Math.max(1, Math.ceil(draftTotal / DESIGNS_PER_PAGE)),
  };
}
