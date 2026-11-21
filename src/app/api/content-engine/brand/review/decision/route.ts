import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { isContentEngineEnabled, unavailableContentEngine } from "@/lib/content-engine/feature-gate";
import { isContentShopId, ownedContentShop } from "@/lib/content-engine/shop-access";
import type { BrandProfileDraft } from "@/lib/content-engine/brand-profile";
import { BrandApprovalError, decideBrandReview } from "@/lib/content-engine/brand-approval";

export const runtime = "nodejs";
const PRIVATE_HEADERS = { "Cache-Control": "no-store" };

function sameOrigin(request: NextRequest): boolean {
  try {
    const origin = request.headers.get("origin");
    const host = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() || request.headers.get("host");
    return !!origin && !!host && new URL(origin).host.toLowerCase() === host.toLowerCase();
  } catch { return false; }
}

/**
 * Merchant-owned account approval only; agency and designer approval delegation
 * is NOT enabled. This is a customer attestation, not an internal quality review.
 */
export async function POST(request: NextRequest) {
  if (!isContentEngineEnabled()) return unavailableContentEngine();
  const user = await getCurrentUser();
  if (!user) return Response.json({error:"login_required"},{status:401,headers:PRIVATE_HEADERS});
  if (!sameOrigin(request)) return Response.json({error:"invalid_origin"},{status:403,headers:PRIVATE_HEADERS});
  if (Number(request.headers.get("content-length") || 0)>4096)
    return Response.json({error:"too_large"},{status:413,headers:PRIVATE_HEADERS});
  let body:unknown;
  try { body=await request.json(); } catch { return Response.json({error:"invalid_json"},{status:400,headers:PRIVATE_HEADERS}); }
  if (!body || typeof body!=="object" || Array.isArray(body))
    return Response.json({error:"invalid_input"},{status:422,headers:PRIVATE_HEADERS});
  const v=body as Record<string,unknown>;
  if (!isContentShopId(v.shopId) || !Number.isSafeInteger(v.expectedRevision) ||
      (v.expectedRevision as number)<1 || !["approve","request_changes"].includes(String(v.decision)))
    return Response.json({error:"invalid_input"},{status:422,headers:PRIVATE_HEADERS});
  const shopId=v.shopId;
  const shop=await ownedContentShop(user.id,shopId);
  if (!shop || shop.industry!=="sushi")
    return Response.json({error:"shop_not_found"},{status:404,headers:PRIVATE_HEADERS});

  // Explicit merchant affirmation must be supplied for each publishable asset.
  // Client cannot submit sourcePermission, SHA or storage keys.
  const approve=v.decision==="approve";
  const assetIds=v.approvedAssetIds;
  if (approve && (v.confirmBrandFacts!==true || v.confirmImageRights!==true ||
      !Array.isArray(assetIds) || assetIds.length>8 ||
      assetIds.some(id=>typeof id!=="string" || !/^[a-f0-9]{24}$/.test(id)) ||
      new Set(assetIds).size!==assetIds.length))
    return Response.json({error:"merchant_confirmation_required"},{status:422,headers:PRIVATE_HEADERS});
  try {
    const result=await prisma.$transaction(async tx=>{
      const current=await tx.contentBrandProfile.findUnique({where:{shopId}});
      if (!current || current.revision!==v.expectedRevision) return null;
      const draft=current.data as unknown as BrandProfileDraft;
      if (draft.tenantId!==shopId || draft.profileId!==current.id ||
          draft.version!==current.revision || draft.status!=="pending_review")
        return null;
      const input=structuredClone(draft);
      if (approve) {
        const supplied=new Set(assetIds as string[]);
        const expected=new Set(input.assets.map(a=>a.assetId));
        if (supplied.size!==expected.size || [...expected].some(id=>!supplied.has(id)))
          throw new BrandApprovalError("asset_confirmation_mismatch");
        const stored=await tx.contentBrandAsset.findMany({
          where:{shopId,id:{in:[...expected]}},
          select:{id:true,key:true,sha256:true},
        });
        if (stored.length!==expected.size || input.assets.some(a=>{
          const record=stored.find(x=>x.id===a.assetId);
          return !record || record.key!==a.originalStorageKey || record.sha256!==a.sha256;
        })) throw new BrandApprovalError("asset_ownership_or_hash_mismatch");
        input.businessName.status="merchant_confirmed";
        input.businessName.reviewedBy=user.id;
        input.serviceArea.status="merchant_confirmed";
        input.serviceArea.reviewedBy=user.id;
        input.preferredLocale.status="merchant_confirmed";
        input.preferredLocale.reviewedBy=user.id;
        // Optional brand styling is approved by the merchant, but do not
        // auto-confirm factual claims extracted from AI or other sources.
        for (const asset of input.assets) {
          asset.sourcePermission="merchant_owned";
          asset.approvedForPublishing=true;
        }
      }
      const now=new Date().toISOString();
      const transition=decideBrandReview(input,user.id,approve?"approve":"request_changes",now);
      transition.profile.version=current.revision+1;
      const updated=await tx.contentBrandProfile.updateMany({
        where:{shopId,revision:current.revision},
        data:{revision:{increment:1},data:transition.profile as unknown as object}
      });
      if (!updated.count) return null;
      const audit=await tx.contentBrandReviewEvent.create({
        data:{
          shopId,actorUserId:user.id,event:approve?"approved_by_merchant":"changes_requested",
          revision:current.revision+1,snapshot:transition.profile as unknown as object
        },
        select:{id:true,event:true,revision:true,createdAt:true}
      });
      return {audit,status:transition.profile.status};
    });
    if (!result) return Response.json({error:"revision_conflict"},{status:409,headers:PRIVATE_HEADERS});
    return Response.json({ok:true,event:result.audit,status:result.status,revision:result.audit.revision},{headers:PRIVATE_HEADERS});
  } catch(error) {
    if (error instanceof BrandApprovalError)
      return Response.json({error:error.reason},{status:422,headers:PRIVATE_HEADERS});
    return Response.json({error:"review_decision_failed"},{status:500,headers:PRIVATE_HEADERS});
  }
}
