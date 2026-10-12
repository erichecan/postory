import "server-only";
import { prisma } from "./client";
import type { Prisma } from "@/generated/prisma/client";
import { localDayBounds, localMinutesAt } from "@/lib/nails/time";
import { computeAvailableSlots } from "@/lib/nails/availability";

async function withOwner<T>(userId: string, run: (tx: Prisma.TransactionClient) => Promise<T>) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT set_config('app.studio_owner_id', ${userId}, true)`;
    return run(tx);
  });
}

const includePost = { media: { orderBy: { position: "asc" as const }, include: { mediaAsset: true } }, availability: { orderBy: { startAt: "asc" as const } }, exports: { orderBy: { createdAt: "desc" as const } } };

export function createNailsPost(userId: string, studioId: string, mediaIds: string[]) {
  return withOwner(userId, async (tx) => {
    const assets = await tx.mediaAsset.findMany({ where: { id: { in: mediaIds }, studioId }, select: { id: true } });
    if (assets.length !== mediaIds.length) throw new Error("MEDIA_NOT_OWNED");
    return tx.nailsPost.create({ data: { studioId, media: { create: mediaIds.map((mediaAssetId, position) => ({ mediaAssetId, position })) } }, select: { id: true } });
  });
}

export function getNailsPost(userId: string, studioId: string, postId: string) {
  return withOwner(userId, (tx) => tx.nailsPost.findFirst({ where: { id: postId, studioId }, include: includePost }));
}

export function listNailsPosts(userId: string, studioId: string) {
  return withOwner(userId, (tx) => tx.nailsPost.findMany({ where: { studioId }, include: includePost, orderBy: { updatedAt: "desc" }, take: 100 }));
}

export function updateNailsPost(userId: string, studioId: string, postId: string, data: { title: string; body: string; tags: string[]; theme: "SHOWCASE" | "OPEN_SLOTS" | "PROMOTION" | "DAILY"; template: "WORK" | "SLOTS" | "PROMOTION"; mediaIds?: string[] }) {
  return withOwner(userId, async (tx) => {
    const post = await tx.nailsPost.findFirst({ where: { id: postId, studioId }, select: { id: true } });
    if (!post) return null;
    if (data.mediaIds) {
      const assets = await tx.mediaAsset.findMany({ where: { id: { in: data.mediaIds }, studioId }, select: { id: true } });
      if (assets.length !== data.mediaIds.length) throw new Error("MEDIA_NOT_OWNED");
      await tx.nailsPostMedia.deleteMany({ where: { postId } });
      await tx.nailsPostMedia.createMany({ data: data.mediaIds.map((mediaAssetId, position) => ({ postId, mediaAssetId, position })) });
    }
    return tx.nailsPost.update({ where: { id: postId }, data: { title: data.title, body: data.body, tags: data.tags, theme: data.theme, template: data.template } });
  });
}

export function reserveNailsAiGeneration(userId: string, studioId: string, postId: string) {
  return withOwner(userId, async (tx) => {
    const result = await tx.nailsPost.updateMany({ where: { id: postId, studioId, aiGenerationCount: { lt: 5 } }, data: { aiGenerationCount: { increment: 1 } } });
    return result.count === 1;
  });
}

export function saveNailsAvailability(userId: string, studioId: string, postId: string, startAt: Date | null) {
  return withOwner(userId, async (tx) => {
    const post = await tx.nailsPost.findFirst({ where: { id: postId, studioId }, select: { id: true } });
    if (!post) return false;
    if (startAt) {
      const studio = await tx.studio.findUniqueOrThrow({ where: { id: studioId }, select: { timeZone: true, defaultDurationMinutes: true } });
      if (startAt.getTime() <= Date.now()) return false;
      const localDate = localMinutesAt(startAt, studio.timeZone).date;
      const { start, end } = localDayBounds(localDate, studio.timeZone);
      const [businessHours, appointments, closedPeriods] = await Promise.all([
        tx.businessHours.findMany({ where: { studioId } }),
        tx.appointment.findMany({ where: { studioId, startAt: { lt: end }, endAt: { gt: start } } }),
        tx.closedPeriod.findMany({ where: { studioId, startAt: { lt: end }, endAt: { gt: start } } }),
      ]);
      const allowed = computeAvailableSlots({ businessHours, appointments, closedPeriods, localDate, timeZone: studio.timeZone, durationMinutes: studio.defaultDurationMinutes });
      if (!allowed.some((candidate) => candidate.startAt.getTime() === startAt.getTime())) return false;
      await tx.nailsPostAvailability.deleteMany({ where: { postId } });
      await tx.nailsPostAvailability.create({ data: { postId, startAt, endAt: new Date(startAt.getTime() + studio.defaultDurationMinutes * 60_000), timeZone: studio.timeZone } });
    } else await tx.nailsPostAvailability.deleteMany({ where: { postId } });
    return true;
  });
}

export function createNailsPostExport(userId: string, studioId: string, postId: string, storageKey: string) {
  return withOwner(userId, async (tx) => {
    const post = await tx.nailsPost.findFirst({ where: { id: postId, studioId }, select: { id: true } });
    if (!post) return false;
    await tx.nailsPostExport.create({ data: { postId, storageKey, mimeType: "image/png" } });
    await tx.nailsPost.update({ where: { id: postId }, data: { status: "EXPORTED", exportedAt: new Date() } });
    return true;
  });
}

export function markNailsPostPublished(userId: string, studioId: string, postId: string) {
  return withOwner(userId, async (tx) => {
    const result = await tx.nailsPost.updateMany({ where: { id: postId, studioId, status: "EXPORTED" }, data: { status: "PUBLISHED", publishedAt: new Date() } });
    return result.count === 1;
  });
}

export function getNailsPostExport(userId: string, studioId: string, exportId: string) {
  return withOwner(userId, async (tx) => tx.nailsPostExport.findFirst({ where: { id: exportId, post: { studioId } } }));
}

export function duplicateNailsPost(userId: string, studioId: string, postId: string) {
  return withOwner(userId, async (tx) => {
    const original = await tx.nailsPost.findFirst({ where: { id: postId, studioId }, include: { media: { orderBy: { position: "asc" } } } });
    if (!original) return null;
    return tx.nailsPost.create({ data: { studioId, theme: original.theme, template: original.template, title: original.title, body: original.body, tags: original.tags, platform: original.platform, media: { create: original.media.map((item) => ({ mediaAssetId: item.mediaAssetId, position: item.position })) } }, select: { id: true } });
  });
}
