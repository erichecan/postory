import "server-only";
import { prisma } from "./client";
import type { Prisma } from "@/generated/prisma/client";
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

export async function listOwnDesigns(userId: string) {
  return prisma.design.findMany({
    where: { userId },
    orderBy: [{ updatedAt: "desc" }],
    select: {
      id: true,
      title: true,
      status: true,
      platforms: true,
      scheduledAt: true,
      updatedAt: true,
      template: { select: { thumbnails: true, width: true, height: true } },
    },
  });
}
