"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { assertUser, requireUser } from "@/lib/auth/session";
import { getAyrshareGateway, isAyrshareSupported, type PublishResult } from "@/lib/ayrshare";
import { createDesignFromTemplate, deleteOwnDesign, updateOwnDesign } from "@/lib/db/designs";
import { chargeDesign, getEntitlements } from "@/lib/db/entitlements";
import { getAyrshareProfileKey, listConnectedPlatforms } from "@/lib/db/social";
import { designPagesSchema } from "@/lib/design-schema";
import { PUBLISH_PLATFORMS } from "@/lib/platforms";
import { firstError } from "@/lib/validation";

export async function startDesignAction(templateId: string) {
  const user = await requireUser();
  const design = await createDesignFromTemplate(user.id, z.string().max(64).parse(templateId));
  if (!design) redirect("/templates");
  redirect(`/editor/${design.id}`);
}

async function designError(key: "invalidData" | "notFound") {
  return (await getTranslations("designs.errors"))(key);
}

export async function saveDesignAction(id: string, input: unknown): Promise<{ ok: boolean; error?: string }> {
  const user = await assertUser();
  const parsed = z.object({ title: z.string().trim().min(1).max(128), pages: designPagesSchema }).safeParse(input);
  if (!parsed.success) return { ok: false, error: await designError("invalidData") };
  const ok = await updateOwnDesign(user.id, z.string().max(40).parse(id), parsed.data);
  if (ok) revalidatePath("/designs");
  return ok ? { ok } : { ok, error: await designError("notFound") };
}

const scheduleSchema = z.object({
  platforms: z.array(z.enum(PUBLISH_PLATFORMS)).min(1, "publishPlatformsRequired"),
  scheduledAt: z
    .string({ error: "publishTimeRequired" })
    .transform((v) => new Date(v))
    .refine((d) => !Number.isNaN(d.getTime()), "publishTimeRequired")
    .refine((d) => d.getTime() > Date.now() - 60_000, "publishTimePast"),
  caption: z.string().trim().min(1, "captionRequired").max(2200, "captionTooLong"),
  exportedImageUrl: z.string().trim().max(500).optional(),
});

export type ScheduleResult =
  | { ok: true; publishStatus?: PublishResult["overallStatus"] }
  | {
      ok: false;
      error: string;
      code?: "insufficient" | "needPlan" | "platformNotAllowed" | "exportMissing" | "platformNotConnected";
      need?: number;
      have?: number;
    };

export async function scheduleDesignAction(id: string, input: unknown): Promise<ScheduleResult> {
  const user = await assertUser();
  const designId = z.string().max(40).parse(id);
  const parsed = scheduleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: await firstError(parsed.error) };
  const tb = await getTranslations("editor.publish");
  const ent = await getEntitlements(user.id);
  if (!ent.hasActivePlan) return { ok: false, code: "needPlan", error: tb("needPlan") };
  if (parsed.data.platforms.some((p) => !ent.allowedPlatforms.includes(p))) return { ok: false, code: "platformNotAllowed", error: tb("platformNotAllowed") };

  const livePlatforms = parsed.data.platforms.filter(isAyrshareSupported);
  if (livePlatforms.length > 0) {
    if (!parsed.data.exportedImageUrl) return { ok: false, code: "exportMissing", error: tb("exportMissing") };
    const connected = new Set(await listConnectedPlatforms(user.id));
    if (livePlatforms.some((p) => !connected.has(p))) return { ok: false, code: "platformNotConnected", error: tb("platformNotConnected") };
  }

  const charge = await chargeDesign(user.id, designId);
  if (!charge.found) return { ok: false, error: await designError("notFound") };
  if (!charge.ok) return { ok: false, code: "insufficient", error: tb("insufficient"), need: charge.need, have: charge.have };

  let publishStatus: PublishResult["overallStatus"] | undefined;
  let publishError: string | null | undefined;
  let ayrsharePostId: string | undefined;
  // charge.duplicate = 这个作品之前已经处理过一次（不管当时发布成不成功），
  // 这里不重新调用真实发布接口——否则用户只是想改个发布时间/文案重新提交，就会在社交平台上重复发一条。
  if (livePlatforms.length > 0 && !charge.duplicate) {
    try {
      const profileKey = await getAyrshareProfileKey(user.id);
      if (!profileKey) throw new Error("no ayrshare profile on file");
      const result = await getAyrshareGateway().publish({
        profileKey,
        caption: parsed.data.caption,
        mediaUrl: parsed.data.exportedImageUrl!,
        platforms: livePlatforms,
        scheduleDate: parsed.data.scheduledAt,
      });
      publishStatus = result.overallStatus;
      ayrsharePostId = result.postId;
      publishError =
        result.overallStatus === "SUCCESS"
          ? null
          : result.perPlatform
              .filter((p) => p.status === "error")
              .map((p) => `${p.platform}: ${p.error ?? "error"}`)
              .join("; ");
    } catch (err) {
      publishStatus = "FAILED";
      publishError = err instanceof Error ? err.message : "unknown";
    }
  }

  const ok = await updateOwnDesign(user.id, designId, {
    platforms: parsed.data.platforms,
    scheduledAt: parsed.data.scheduledAt,
    status: "SCHEDULED",
    caption: parsed.data.caption,
    exportedImageUrl: parsed.data.exportedImageUrl ?? null,
    ayrsharePostId,
    publishStatus,
    publishError,
  });
  if (!ok) return { ok: false, error: await designError("notFound") };
  revalidatePath("/designs");
  if (!charge.duplicate) revalidatePath("/", "layout");
  return { ok: true, publishStatus };
}

export async function deleteDesignAction(id: string): Promise<{ ok: boolean }> {
  const user = await assertUser();
  const ok = await deleteOwnDesign(user.id, z.string().max(40).parse(id));
  if (ok) revalidatePath("/designs");
  return { ok };
}
