"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { RATIO_IDS, RATIOS, SCENES } from "@/components/create/studio-options";
import { decodeUpload } from "@/lib/ai/image-bytes";
import { buildPrompt } from "@/lib/ai/prompt";
import { dailyCostCapMicros, estimateCostMicros } from "@/lib/ai/provider";
import { assertUser } from "@/lib/auth/session";
import { CHARGE_CREDITS } from "@/lib/billing/plan-math";
import { chargeCredits, getAiBalance } from "@/lib/db/credits";
import { createDesignFromImage } from "@/lib/db/designs";
import { getEntitlements } from "@/lib/db/entitlements";
import { chargeRef, discardGeneration, failGeneration, getOwnGeneration, reapStaleGenerations, reserveGeneration, setGenerationInput } from "@/lib/db/generations";
import { getBrandProfile } from "@/lib/db/profiles";
import { DEMO_PHONE } from "@/lib/demo";
import { mediaKey, mediaUrl, putObject } from "@/lib/storage";

const createSchema = z.object({
  mode: z.enum(["photo", "text"]),
  scene: z.enum(SCENES).nullable(),
  prompt: z.string().trim().max(500),
  ratio: z.enum(RATIO_IDS),
  quality: z.enum(["standard", "hd"]),
  useBrand: z.boolean(),
  parentId: z.string().max(40).nullable(),
  photo: z.string().max(16 * 1024 * 1024).nullable(),
});

export type CreateGenerationInput = z.input<typeof createSchema>;

type FailCode = "demo" | "invalid" | "needPhoto" | "needPrompt" | "badType" | "tooLarge" | "parentNotFound" | "busy" | "rateLimited" | "capReached" | "insufficient" | "storageFailed";

export type CreateGenerationResult =
  | { ok: true; id: string; balance: number }
  | { ok: false; code: FailCode; error: string; need?: number; have?: number; hasPlan?: boolean };

async function fail(code: FailCode, extra: { need?: number; have?: number; hasPlan?: boolean } = {}): Promise<CreateGenerationResult> {
  const t = await getTranslations("create.errors");
  return { ok: false, code, error: t(code), ...extra };
}

export async function createGenerationAction(raw: CreateGenerationInput): Promise<CreateGenerationResult> {
  const user = await assertUser();
  if (user.phone === DEMO_PHONE) return fail("demo");
  const parsed = createSchema.safeParse(raw);
  if (!parsed.success) return fail("invalid");
  const input = parsed.data;

  const parent = input.parentId ? await getOwnGeneration(user.id, input.parentId) : null;
  if (input.parentId && (!parent || parent.status !== "SUCCEEDED" || !parent.outputUrl)) return fail("parentNotFound");
  if (parent && !input.prompt) return fail("needPrompt");
  if (!parent && input.mode === "text" && !input.prompt && !input.scene) return fail("needPrompt");

  let upload: { bytes: Buffer; mime: string } | null = null;
  if (!parent && input.mode === "photo") {
    if (!input.photo) return fail("needPhoto");
    const decoded = decodeUpload(input.photo);
    if (!decoded.ok) return fail(decoded.error);
    upload = decoded;
  }

  const brand = input.useBrand ? await getBrandProfile(user.id) : null;
  const mode = parent ? parent.mode : input.mode === "photo" ? "PHOTO_ENHANCE" : "TEXT_TO_IMAGE";
  const charge = input.quality === "hd" ? "AI_HD" : "AI_STANDARD";
  const finalPrompt = buildPrompt({
    mode: mode === "PHOTO_ENHANCE" ? "photo" : "text",
    scene: parent ? null : input.scene,
    userPrompt: input.prompt,
    brand: brand ? { shopName: brand.shopName, slogan: brand.slogan } : null,
    refine: parent !== null,
  });

  await reapStaleGenerations(user.id);
  const reserved = await reserveGeneration(user.id, {
    mode,
    quality: input.quality,
    size: input.ratio,
    userPrompt: input.prompt || (input.scene ?? ""),
    finalPrompt,
    parentId: parent?.id ?? null,
    inputUrl: parent?.outputUrl ?? null,
    credits: CHARGE_CREDITS[charge],
    estimateMicros: estimateCostMicros(input.quality),
    capMicros: dailyCostCapMicros(),
  });
  if (!reserved.ok) return fail(reserved.code);

  const paid = await chargeCredits(user.id, charge, chargeRef(reserved.id));
  if (!paid.ok) {
    await discardGeneration(reserved.id);
    const { hasActivePlan } = await getEntitlements(user.id);
    return fail("insufficient", { need: paid.need, have: paid.have, hasPlan: hasActivePlan });
  }

  if (upload) {
    try {
      const key = mediaKey(user.id, reserved.id, "in", upload.mime);
      await putObject(key, upload.bytes);
      await setGenerationInput(reserved.id, mediaUrl(key));
    } catch {
      await failGeneration(user.id, reserved.id, "input storage failed");
      return fail("storageFailed");
    }
  }

  revalidatePath("/", "layout");
  return { ok: true, id: reserved.id, balance: await getAiBalance(user.id) };
}

export async function sendToEditorAction(generationId: string) {
  const user = await assertUser();
  const gen = await getOwnGeneration(user.id, z.string().max(40).parse(generationId));
  if (!gen || gen.status !== "SUCCEEDED" || !gen.outputUrl) return { ok: false as const, error: (await getTranslations("create.errors"))("parentNotFound") };
  const canvas = (RATIOS.find((r) => r.id === gen.size) ?? RATIOS[0]).canvas;
  const design = await createDesignFromImage(user.id, { title: gen.userPrompt || "AI", imageUrl: gen.outputUrl, ...canvas });
  revalidatePath("/designs");
  redirect(`/editor/${design.id}`);
}
