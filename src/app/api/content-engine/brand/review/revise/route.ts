import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { isContentEngineEnabled, unavailableContentEngine } from "@/lib/content-engine/feature-gate";
import { isContentShopId, ownedContentShop } from "@/lib/content-engine/shop-access";
import type { BrandProfileDraft } from "@/lib/content-engine/brand-profile";
import { BrandApprovalError, reviseApprovedBrand } from "@/lib/content-engine/brand-approval";

export const runtime = "nodejs";

function sameOrigin(request: NextRequest): boolean {
  try {
    const origin=request.headers.get("origin");
    const host=request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() || request.headers.get("host");
    return !!origin && !!host && new URL(origin).host.toLowerCase()===host.toLowerCase();
  } catch {return false;}
}

/** Merchant begins a new draft; the approved revision is retained in audit history. */
export async function POST(request: NextRequest) {
  if (!isContentEngineEnabled()) return unavailableContentEngine();
  const user=await getCurrentUser();
  if (!user) return Response.json({error:"login_required"},{status:401});
  if (!sameOrigin(request)) return Response.json({error:"invalid_origin"},{status:403});
  if (Number(request.headers.get("content-length")||0)>2048)
    return Response.json({error:"too_large"},{status:413});
  let body:unknown;
  try {body=await request.json();} catch{return Response.json({error:"invalid_json"},{status:400});}
  if (!body || typeof body!=="object" || Array.isArray(body))
    return Response.json({error:"invalid_input"},{status:422});
  const v=body as Record<string,unknown>;
  if (!isContentShopId(v.shopId) || !Number.isSafeInteger(v.expectedRevision) ||
      (v.expectedRevision as number)<1) return Response.json({error:"invalid_input"},{status:422});
  const shopId=v.shopId;
  const shop=await ownedContentShop(user.id,shopId);
  if (!shop || shop.industry!=="sushi")
    return Response.json({error:"shop_not_found"},{status:404});

  try {
    const result=await prisma.$transaction(async tx=>{
      const row=await tx.contentBrandProfile.findUnique({where:{shopId}});
      if (!row || row.revision!==v.expectedRevision) return null;
      const current=row.data as unknown as BrandProfileDraft;
      if (current.profileId!==row.id || current.tenantId!==shopId ||
          current.version!==row.revision || current.status!=="approved") return null;
      const next=reviseApprovedBrand(current,user.id,new Date().toISOString());
      const updated=await tx.contentBrandProfile.updateMany({
        where:{shopId,revision:row.revision},
        data:{revision:{increment:1},data:next.profile as unknown as object}
      });
      if (!updated.count) return null;
      const event=await tx.contentBrandReviewEvent.create({
        data:{shopId,actorUserId:user.id,event:"new_draft_revision",
          revision:next.profile.version,snapshot:next.profile as unknown as object},
        select:{id:true,event:true,revision:true,createdAt:true}
      });
      return event;
    });
    if (!result) return Response.json({error:"revision_conflict"},{status:409});
    return Response.json({ok:true,event:result,status:"draft",revision:result.revision},
      {headers:{"Cache-Control":"no-store"}});
  } catch(error) {
    if (error instanceof BrandApprovalError)
      return Response.json({error:error.reason},{status:422});
    return Response.json({error:"revision_failed"},{status:500});
  }
}
