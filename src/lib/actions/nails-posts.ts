"use server";

import Anthropic from "@anthropic-ai/sdk";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { createNailsPost, duplicateNailsPost, markNailsPostPublished, reserveNailsAiGeneration, saveNailsAvailability, updateNailsPost } from "@/lib/db/nails-posts";
import { getNailsWorkspace } from "@/lib/nails/workspace";
import { listUpcomingAvailabilityForOwner } from "@/lib/db/appointments";

const idSchema = z.string().min(1).max(64);
const contentSchema = z.object({
  title: z.string().max(100), body: z.string().max(3000), tags: z.array(z.string().min(1).max(40)).max(12),
  theme: z.enum(["SHOWCASE", "OPEN_SLOTS", "PROMOTION", "DAILY"]), template: z.enum(["WORK", "SLOTS", "PROMOTION"]),
  mediaIds: z.array(idSchema).max(5).optional(),
});

export async function createNailsPostAction(mediaIds: unknown) {
  const { user, studio } = await getNailsWorkspace();
  const t = await getTranslations("nails");
  const parsed = z.array(idSchema).max(5).safeParse(mediaIds);
  if (!parsed.success) return { ok: false as const, error: t("postInvalid") };
  try {
    const post = await createNailsPost(user.id, studio.id, [...new Set(parsed.data)]);
    return { ok: true as const, id: post.id };
  } catch {
    return { ok: false as const, error: t("postCreateFailed") };
  }
}

export async function saveNailsPostAction(postId: unknown, input: unknown) {
  const { user, studio } = await getNailsWorkspace();
  const t = await getTranslations("nails");
  const id = idSchema.safeParse(postId);
  const data = contentSchema.safeParse(input);
  if (!id.success || !data.success) return { ok: false as const, error: t("postInvalid") };
  try {
    const result = await updateNailsPost(user.id, studio.id, id.data, data.data);
    if (!result) return { ok: false as const, error: t("postNotFound") };
    revalidatePath(`/nails/posts/${id.data}`);
    revalidatePath("/nails/posts");
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: t("postSaveFailed") };
  }
}

export async function generateNailsCopyAction(postId: unknown, details: unknown) {
  const { user, studio } = await getNailsWorkspace();
  const t = await getTranslations("nails");
  const id = idSchema.safeParse(postId);
  const detailSchema = z.object({ description: z.string().max(800), service: z.string().max(120), tone: z.enum(["WARM", "PLAYFUL", "ELEGANT"]) });
  const parsed = detailSchema.safeParse(details);
  if (!id.success || !parsed.success) return { ok: false as const, error: t("postInvalid") };
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { ok: false as const, error: t("postAiUnavailable") };
  const existing = await import("@/lib/db/nails-posts").then((m) => m.getNailsPost(user.id, studio.id, id.data));
  if (!existing) return { ok: false as const, error: t("postNotFound") };
  const current = await listUpcomingAvailabilityForOwner(user.id, 21);
  const currentSlotTimes = new Set(Object.values(current.availabilityByDate).flat().map((slot) => slot.startAt.getTime()));
  const validAvailability = existing.availability.filter((availability) => currentSlotTimes.has(availability.startAt.getTime()));
  const reserved = await reserveNailsAiGeneration(user.id, studio.id, id.data);
  if (!reserved) return { ok: false as const, error: t("postAiLimit") };
  try {
    const client = new Anthropic({ apiKey, timeout: 30_000, maxRetries: 1 });
    const response = await client.messages.create({
      model: process.env.ANTHROPIC_TEXT_MODEL || "claude-haiku-4-5-20251001", max_tokens: 900,
      system: "Write natural, accurate Simplified Chinese Xiaohongshu posts for an independent nail artist. Output only JSON: {title:string, body:string, tags:string[]}. Never invent prices, discounts, available appointment times, guarantees, locations, or customer reviews. State only facts explicitly supplied by the user or the current availability snapshot. Avoid medical claims and absolute promises. Use at most 8 tags.",
      messages: [{ role: "user", content: JSON.stringify({ platform: "Xiaohongshu", theme: existing.theme, studio: studio.name, timeZone: studio.timeZone, service: parsed.data.service, description: parsed.data.description, tone: parsed.data.tone, currentlyAvailableTimes: validAvailability.map((a) => new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short", timeZone: studio.timeZone }).format(a.startAt)) }) }],
    });
    const text = response.content.find((block) => block.type === "text")?.text ?? "";
    const json = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1)) as { title?: unknown; body?: unknown; tags?: unknown };
    const output = z.object({ title: z.string().max(100), body: z.string().max(3000), tags: z.array(z.string().max(40)).max(8) }).parse(json);
    await updateNailsPost(user.id, studio.id, id.data, { title: output.title, body: output.body, tags: output.tags, theme: existing.theme, template: existing.template });
    revalidatePath(`/nails/posts/${id.data}`);
    return { ok: true as const, copy: output };
  } catch (error) {
    console.error("Nails copy generation failed", error instanceof Error ? error.name : "Unknown error");
    return { ok: false as const, error: t("postAiFailed") };
  }
}

export async function saveNailsPostAvailabilityAction(postId: unknown, startAt: unknown) {
  const { user, studio } = await getNailsWorkspace();
  const id = idSchema.safeParse(postId);
  const date = startAt === null ? { success: true as const, data: null } : z.string().datetime().safeParse(startAt);
  if (!id.success || !date.success) return { ok: false as const };
  const ok = await saveNailsAvailability(user.id, studio.id, id.data, date.data ? new Date(date.data) : null);
  revalidatePath(`/nails/posts/${id.data}`);
  return { ok };
}

export async function markNailsPostPublishedAction(postId: unknown) {
  const { user, studio } = await getNailsWorkspace();
  const id = idSchema.safeParse(postId);
  if (!id.success) return { ok: false as const };
  const ok = await markNailsPostPublished(user.id, studio.id, id.data);
  revalidatePath("/nails/posts");
  revalidatePath(`/nails/posts/${id.data}`);
  return { ok };
}

export async function duplicateNailsPostAction(postId: unknown) {
  const { user, studio } = await getNailsWorkspace();
  const id = idSchema.safeParse(postId);
  if (!id.success) return { ok: false as const };
  const result = await duplicateNailsPost(user.id, studio.id, id.data);
  revalidatePath("/nails/posts");
  return result ? { ok: true as const, id: result.id } : { ok: false as const };
}
