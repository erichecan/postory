import "server-only";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/db/client";
import { getObject, parseContentBrandMediaKey } from "@/lib/storage";
import { isContentShopId } from "./shop-access";
import { isApprovedBrandSnapshot } from "./brand-approval";
import type { BrandProfileDraft, BrandAssetReference } from "./brand-profile";

/**
 * Resolve the latest merchant-approved immutable snapshot, even if the
 * editable current profile has since become a newer draft.
 *
 * Caller must obtain ownerId from an authenticated server session.
 * Approval history is never read by shopId alone.
 */
export async function loadApprovedBrandSnapshot(ownerId: string, shopId: string) {
  if (!ownerId || !isContentShopId(shopId)) return null;
  const shop = await prisma.contentBrandShop.findFirst({
    where:{id:shopId,ownerId},
    select:{id:true,profile:{select:{id:true}}},
  });
  if (!shop?.profile) return null;
  const review = await prisma.contentBrandReviewEvent.findFirst({
    where:{shopId,event:"approved_by_merchant"},
    orderBy:[{revision:"desc"},{createdAt:"desc"}],
    select:{id:true,revision:true,snapshot:true},
  });
  if (!review) return null;
  const profile = review.snapshot as unknown as BrandProfileDraft;
  if (profile.tenantId!==shopId || profile.profileId!==shop.profile.id ||
      profile.version!==review.revision || !isApprovedBrandSnapshot(profile)) return null;
  return {profile,approvalEventId:review.id,revision:review.revision};
}

/**
 * Authorize a source image against both the approved version and the current
 * tenant-owned DB row. The bytes must still hash to the approved original.
 */
export async function loadApprovedBrandPhoto(
  ownerId: string, shopId: string, profile: BrandProfileDraft, assetId: string,
): Promise<Buffer | null> {
  if (!ownerId || !isContentShopId(shopId) || profile.tenantId!==shopId ||
      !isApprovedBrandSnapshot(profile)) return null;
  const reference: BrandAssetReference | undefined = profile.assets.find(a=>a.assetId===assetId);
  if (!reference || !reference.approvedForPublishing ||
      !["merchant_owned","merchant_licensed"].includes(reference.sourcePermission)) return null;
  const asset = await prisma.contentBrandAsset.findFirst({
    where:{id:assetId,shopId,shop:{ownerId}},
    select:{id:true,key:true,sha256:true},
  });
  if (!asset || asset.key!==reference.originalStorageKey || asset.sha256!==reference.sha256)
    return null;
  const keyInfo = parseContentBrandMediaKey(asset.key);
  if (!keyInfo || keyInfo.ownerId!==shopId || keyInfo.assetId!==assetId) return null;
  const stored = await getObject(asset.key);
  if (!stored) return null;
  if (createHash("sha256").update(stored.bytes).digest("hex")!==reference.sha256) return null;
  return stored.bytes;
}
