import "server-only";
import { prisma } from "./client";
import type { Prisma } from "@/generated/prisma/client";

const LIST_LIMIT = 100;

// userId must come from a validated server session, never from submitted fields.
async function withOwner<T>(userId: string, run: (tx: Prisma.TransactionClient) => Promise<T>) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT set_config('app.studio_owner_id', ${userId}, true)`;
    return run(tx);
  });
}

export function listMediaAssetsForOwner(userId: string, studioId: string) {
  return withOwner(userId, (tx) =>
    tx.mediaAsset.findMany({ where: { studioId }, orderBy: { createdAt: "desc" }, take: LIST_LIMIT }),
  );
}

export type NewMediaAsset = { id: string; key: string; mimeType: string; byteSize: number; width: number; height: number };

export function createMediaAssetForOwner(userId: string, studioId: string, input: NewMediaAsset) {
  return withOwner(userId, (tx) => tx.mediaAsset.create({ data: { ...input, studioId } }));
}

export async function deleteMediaAssetForOwner(userId: string, studioId: string, assetId: string) {
  return withOwner(userId, async (tx) => {
    const asset = await tx.mediaAsset.findFirst({ where: { id: assetId, studioId } });
    if (!asset) return null;
    await tx.mediaAsset.delete({ where: { id: asset.id } });
    return asset;
  });
}

export async function isNailsMediaServable(userId: string, studioId: string, assetId: string) {
  const asset = await withOwner(userId, (tx) =>
    tx.mediaAsset.findFirst({ where: { id: assetId, studioId }, select: { id: true } }),
  );
  return asset !== null;
}
