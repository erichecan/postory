"use server";

import { z } from "zod";
import { assertAdmin } from "@/lib/auth/session";
import { issueDemoTrialOverride } from "@/lib/demo/trial-protection";

export async function issueDemoTrialOverrideAction(rawReason: string) {
  const admin = await assertAdmin();
  const parsed = z.string().trim().max(255).safeParse(rawReason);
  if (!parsed.success) return { ok: false as const, error: "说明最多 255 个字符。" };
  const issued = await issueDemoTrialOverride({ createdById: admin.id, reason: parsed.data || undefined });
  return { ok: true as const, ...issued };
}
