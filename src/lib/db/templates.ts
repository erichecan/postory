import "server-only";
import { unstable_cache } from "next/cache";
import { prisma } from "./client";
import type { Prisma } from "@/generated/prisma/client";
import type { DesignPage } from "@/types/design";
import type { PlatformId } from "@/lib/platforms";

export const TEMPLATES_PER_PAGE = 24;

const cardSelect = {
  id: true,
  title: true,
  platform: true,
  width: true,
  height: true,
  thumbnails: true,
  editable: true,
} satisfies Prisma.TemplateSelect;

export type TemplateCard = Prisma.TemplateGetPayload<{ select: typeof cardSelect }>;

export async function listTemplates(opts: { platform?: PlatformId; q?: string; page: number }) {
  const where: Prisma.TemplateWhereInput = {
    ...(opts.platform ? { platform: opts.platform } : {}),
    ...(opts.q ? { title: { contains: opts.q, mode: "insensitive" } } : {}),
  };
  const [items, total] = await prisma.$transaction([
    prisma.template.findMany({
      where,
      select: cardSelect,
      orderBy: { sortOrder: "asc" },
      skip: (opts.page - 1) * TEMPLATES_PER_PAGE,
      take: TEMPLATES_PER_PAGE,
    }),
    prisma.template.count({ where }),
  ]);
  return { items, total, pageCount: Math.max(1, Math.ceil(total / TEMPLATES_PER_PAGE)) };
}

export async function countTemplatesByPlatform() {
  const rows = await prisma.template.groupBy({ by: ["platform"], _count: { _all: true } });
  return Object.fromEntries(rows.map((r) => [r.platform, r._count._all])) as Record<string, number>;
}

export const countAllTemplatesCached = unstable_cache(
  async () => prisma.template.count(),
  ["template-count"],
  { revalidate: 3600 },
);

export async function getTemplate(id: string) {
  const t = await prisma.template.findUnique({ where: { id } });
  return t ? { ...t, pages: t.pages as unknown as DesignPage[] } : null;
}

export async function listSimilarTemplates(id: string, platform: string, take = 6) {
  return prisma.template.findMany({
    where: { platform, id: { not: id } },
    select: cardSelect,
    orderBy: { sortOrder: "asc" },
    take,
  });
}
