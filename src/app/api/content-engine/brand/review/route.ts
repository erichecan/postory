import { isContentEngineEnabled, unavailableContentEngine } from "@/lib/content-engine/feature-gate";
import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { isContentShopId, ownedContentShop } from "@/lib/content-engine/shop-access";
import { prisma } from "@/lib/db/client";
import type { BrandProfileDraft } from "@/lib/content-engine/brand-profile";

export const runtime = "nodejs";

function isSameOrigin(request: NextRequest): boolean {
  try {
    const origin = request.headers.get("origin");
    const host = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() || request.headers.get("host");
    return !!origin && !!host && new URL(origin).host.toLowerCase() === host.toLowerCase();
  } catch { return false; }
}

export async function GET(request: NextRequest) {
  if (!isContentEngineEnabled()) return unavailableContentEngine();
  const user = await getCurrentUser();
  if (!user) return Response.json({error:"login_required"},{status:401});
  const shopId = request.nextUrl.searchParams.get("shopId");
  if (!isContentShopId(shopId) || !(await ownedContentShop(user.id,shopId)))
    return Response.json({error:"shop_not_found"},{status:404});
  const events = await prisma.contentBrandReviewEvent.findMany({
    where:{shopId},
    orderBy:{createdAt:"desc"},
    take:50,
    select:{id:true,event:true,revision:true,createdAt:true}
  });
  return Response.json({events},{headers:{"Cache-Control":"no-store"}});
}

export async function POST(request: NextRequest) {
  if (!isContentEngineEnabled()) return unavailableContentEngine();
  const user = await getCurrentUser();
  if (!user) return Response.json({error:"login_required"},{status:401});
  if (!isSameOrigin(request)) return Response.json({error:"invalid_origin"},{status:403});
  if (Number(request.headers.get("content-length")||0)>2048)
    return Response.json({error:"too_large"},{status:413});
  let body:unknown;
  try {body=await request.json()} catch {return Response.json({error:"invalid_json"},{status:400});}
  if (!body || typeof body!=="object") return Response.json({error:"invalid_input"},{status:422});
  const v=body as Record<string,unknown>;
  if (!isContentShopId(v.shopId)|| !Number.isSafeInteger(v.expectedRevision))
    return Response.json({error:"invalid_input"},{status:422});
  const shopId=v.shopId;
  const shop=await ownedContentShop(user.id,shopId);
  if (!shop || shop.industry!=="sushi") return Response.json({error:"shop_not_found"},{status:404});
  const current=await prisma.contentBrandProfile.findUnique({where:{shopId}});
  if (!current || current.revision!==v.expectedRevision)
    return Response.json({error:"revision_conflict"},{status:409});
  const draft=current.data as unknown as BrandProfileDraft;
  if (draft.status!=="draft") return Response.json({error:"already_submitted"},{status:409});
  if (!draft.businessName.value.trim()||!draft.serviceArea.value.trim()||!draft.preferredLocale.value)
    return Response.json({error:"missing_business_facts"},{status:422});
  const expectedAssets=new Set(draft.assets.map(a=>a.assetId));
  const actualAssets=await prisma.contentBrandAsset.findMany({
    where:{shopId,id:{in:[...expectedAssets]}},select:{id:true}
  });
  if (actualAssets.length!==expectedAssets.size) return Response.json({error:"invalid_assets"},{status:422});
  const snapshot:BrandProfileDraft={
    ...draft,status:"pending_review",version:current.revision+1,updatedAt:new Date().toISOString(),
  };
  try {
    const event=await prisma.$transaction(async tx=>{
      const updated=await tx.contentBrandProfile.updateMany({
        where:{shopId,revision:current.revision},
        data:{revision:{increment:1},data:snapshot as unknown as object},
      });
      if (!updated.count) return null;
      return tx.contentBrandReviewEvent.create({
        data:{shopId,actorUserId:user.id,event:"submitted_for_review",
          revision:current.revision+1,snapshot:snapshot as unknown as object},
        select:{id:true,event:true,revision:true,createdAt:true},
      });
    });
    if (!event) return Response.json({error:"revision_conflict"},{status:409});
    return Response.json({ok:true,event,status:"pending_review",revision:event.revision},
      {headers:{"Cache-Control":"no-store"}});
  } catch {
    return Response.json({error:"review_submission_failed"},{status:500});
  }
}
