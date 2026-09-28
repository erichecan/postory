"use server";

import { z } from "zod";
import { assertUser } from "@/lib/auth/session";
import { listTemplates, type TemplateCard } from "@/lib/db/templates";
import { isPlatformId } from "@/lib/platforms";

const inputSchema = z.object({
  platform: z.string().max(32).optional(),
  q: z.string().max(64).optional(),
  page: z.number().int().min(1).max(1000),
});

export async function loadTemplatesAction(input: unknown): Promise<{ items: TemplateCard[]; hasMore: boolean }> {
  await assertUser();
  const { platform, q, page } = inputSchema.parse(input);
  const res = await listTemplates({ platform: isPlatformId(platform) ? platform : undefined, q: q?.trim() || undefined, page });
  return { items: res.items, hasMore: page < res.pageCount };
}
