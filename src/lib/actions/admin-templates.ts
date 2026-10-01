"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdmin } from "@/lib/auth/session";
import { setAiDraftStatus } from "@/lib/db/admin-templates";

export async function adminSetTemplateStatusAction(id: string, status: "draft" | "published"): Promise<{ ok: boolean; error?: string }> {
  await assertAdmin();
  const templateId = z.string().max(80).parse(id);
  const nextStatus = z.enum(["draft", "published"]).parse(status);
  const result = await setAiDraftStatus(templateId, nextStatus);
  if (result.count === 0) return { ok: false, error: "not found" };
  revalidatePath("/admin/ai-drafts");
  revalidatePath("/templates");
  return { ok: true };
}
