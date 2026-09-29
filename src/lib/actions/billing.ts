"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertUser } from "@/lib/auth/session";
import { chargeDesign, getEntitlements } from "@/lib/db/entitlements";

export type ChargeOutcome =
  | { ok: true; charged: number; duplicate: boolean }
  | { ok: false; reason: "insufficient"; need: number; have: number; hasPlan: boolean }
  | { ok: false; reason: "notFound" };

export async function chargeDesignAction(designId: string): Promise<ChargeOutcome> {
  const user = await assertUser();
  const id = z.string().min(1).max(40).parse(designId);
  const result = await chargeDesign(user.id, id);
  if (!result.found) return { ok: false, reason: "notFound" };
  if (!result.ok) {
    const { hasActivePlan } = await getEntitlements(user.id);
    return { ok: false, reason: "insufficient", need: result.need, have: result.have, hasPlan: hasActivePlan };
  }
  if (!result.duplicate) revalidatePath("/", "layout");
  return { ok: true, charged: result.charged, duplicate: result.duplicate };
}
