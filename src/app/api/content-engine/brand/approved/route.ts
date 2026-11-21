import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { isContentEngineEnabled, unavailableContentEngine } from "@/lib/content-engine/feature-gate";
import { loadApprovedBrandSnapshot } from "@/lib/content-engine/approved-snapshot";
import { isContentShopId } from "@/lib/content-engine/shop-access";
import { contentBrandMediaUrl } from "@/lib/storage";

export const runtime = "nodejs";

/** Private metadata used by the content approval workbench. Never returns storage keys. */
export async function GET(request: NextRequest) {
  if (!isContentEngineEnabled()) return unavailableContentEngine();
  const user = await getCurrentUser();
  if (!user) return Response.json({error:"login_required"},{status:401});
  const shopId=request.nextUrl.searchParams.get("shopId");
  if (!isContentShopId(shopId)) return Response.json({error:"invalid_shop"},{status:422});
  const approved=await loadApprovedBrandSnapshot(user.id,shopId);
  if (!approved) return Response.json({error:"approved_brand_not_found"},{status:404,headers:{"Cache-Control":"no-store"}});
  return Response.json({
    approvalEventId:approved.approvalEventId,
    revision:approved.revision,
    businessName:approved.profile.businessName.value,
    assets:approved.profile.assets.filter(asset=>asset.approvedForPublishing &&
      ["merchant_owned","merchant_licensed"].includes(asset.sourcePermission)).map(asset=>({
      id:asset.assetId,kind:asset.kind,url:contentBrandMediaUrl(asset.assetId),
    })),
  },{headers:{"Cache-Control":"private, no-store"}});
}
