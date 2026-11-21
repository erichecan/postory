import "server-only";
import { prisma } from "@/lib/db/client";
import { getObject, parsePublicMediaKey, publicMediaUrl } from "@/lib/storage";
import { captionSha256, inspectPublishRaster, requireExactApproval } from "./approved-raster";

/** Reject external URLs and foreign public assets. No arbitrary-network fetches. */
export function ownedPublicAsset(userId: string, designId: string, url: string): string {
  const prefix = publicMediaUrl("pub/");
  if (!url.startsWith(prefix)) throw new Error("asset_url_not_local");
  const key = "pub/" + url.slice(prefix.length);
  const parsed = parsePublicMediaKey(key);
  if (!parsed || parsed.userId !== userId || parsed.designId !== designId || publicMediaUrl(key) !== url)
    throw new Error("asset_not_owned");
  return key;
}

export async function inspectOwnDesignAsset(userId: string, designId: string, url: string) {
  const key = ownedPublicAsset(userId, designId, url);
  const file = await getObject(key);
  if (!file) throw new Error("approved_image_missing");
  const inspection = await inspectPublishRaster(file.bytes);
  if (file.mime !== inspection.mime) throw new Error("image_mime_mismatch");
  return inspection;
}

export async function verifyLockedDesignAsset(userId: string, designId: string, url: string, caption: string) {
  const design = await prisma.design.findFirst({
    where: { id: designId, userId },
    select: { approvedMediaUrl: true, approvedImageSha256: true, approvedCaptionSha256: true, approvedAt: true },
  });
  if (!design || design.approvedMediaUrl !== url) throw new Error("asset_not_approved");
  const actual = await inspectOwnDesignAsset(userId, designId, url);
  requireExactApproval({
    approvedAt: design.approvedAt,
    expectedImageSha: design.approvedImageSha256,
    actualImageSha: actual.sha256,
    expectedCaptionSha: design.approvedCaptionSha256,
    actualCaption: caption,
  });
  return { url, sha256: actual.sha256, captionSha256: captionSha256(caption) };
}
