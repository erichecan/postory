import "server-only";
import { prisma } from "./client";

export async function listAiDraftTemplates() {
  return prisma.template.findMany({
    where: { source: "ai-generated" },
    orderBy: { id: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      categories: true,
      status: true,
      thumbnails: true,
      platform: true,
      width: true,
      height: true,
    },
  });
}

export type AiDraftTemplate = Awaited<ReturnType<typeof listAiDraftTemplates>>[number];

export async function setAiDraftStatus(id: string, status: "draft" | "published") {
  return prisma.template.updateMany({ where: { id, source: "ai-generated" }, data: { status } });
}
