import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { isContentEngineEnabled, unavailableContentEngine } from "@/lib/content-engine/feature-gate";
import { loadApprovedBrandPhoto, loadApprovedBrandSnapshot } from "@/lib/content-engine/approved-snapshot";
import { isContentShopId } from "@/lib/content-engine/shop-access";
import {
  ContentRenderError, renderContentMedia, CONTENT_FORMATS,
  type ContentFormat, type ContentTemplate,
} from "@/lib/content-engine/deterministic-renderer";

export const runtime = "nodejs";

/**
 * Private, watermarked preview from the last approved merchant snapshot.
 * NEVER exports a publish-ready image or posts to a social network.
 */
export async function POST(request: NextRequest) {
  if (!isContentEngineEnabled()) return unavailableContentEngine();
  const user = await getCurrentUser();
  if (!user) return Response.json({error:"login_required"},{status:401});
  try {
    const origin=request.headers.get("origin");
    const host=request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() || request.headers.get("host");
    if (!origin || !host || new URL(origin).host.toLowerCase()!==host.toLowerCase())
      return Response.json({error:"invalid_origin"},{status:403});
  } catch {return Response.json({error:"invalid_origin"},{status:403});}
  if (Number(request.headers.get("content-length")||0)>4096)
    return Response.json({error:"too_large"},{status:413});
  let body:unknown;
  try { body=await request.json(); } catch {return Response.json({error:"invalid_json"},{status:400});}
  if (!body || typeof body!=="object" || Array.isArray(body))
    return Response.json({error:"invalid_input"},{status:422});
  const v=body as Record<string,unknown>;
  const formats=Object.keys(CONTENT_FORMATS) as ContentFormat[];
  const templates:ContentTemplate[]=["food-editorial","product-feature","local-story"];
  if (!isContentShopId(v.shopId) || typeof v.assetId!=="string" ||
      !/^[a-f0-9]{24}$/.test(v.assetId) ||
      !formats.includes(v.format as ContentFormat) ||
      !templates.includes(v.template as ContentTemplate) ||
      typeof v.headline!=="string" || !v.headline.trim() || v.headline.length>80 ||
      (v.subheadline!==undefined && (typeof v.subheadline!=="string" || v.subheadline.length>70)) ||
      (v.cta!==undefined && (typeof v.cta!=="string" || v.cta.length>38)))
    return Response.json({error:"invalid_input"},{status:422});
  // All branding, image permissions, and bytes come from server-side tenant data.
  const approved=await loadApprovedBrandSnapshot(user.id,v.shopId);
  if (!approved) return Response.json({error:"approved_brand_not_found"},{status:404});
  const photo=await loadApprovedBrandPhoto(user.id,v.shopId,approved.profile,v.assetId);
  if (!photo) return Response.json({error:"approved_asset_not_found"},{status:404});
  try {
    const result=await renderContentMedia({
      profile:approved.profile,photo,sourceAssetId:v.assetId,
      template:v.template as ContentTemplate,format:v.format as ContentFormat,
      headline:v.headline,subheadline:typeof v.subheadline==="string"?v.subheadline:undefined,
      cta:typeof v.cta==="string"?v.cta:undefined,
      mode:"preview"
    });
    return new Response(new Uint8Array(result.bytes),{headers:{
      "Content-Type":"image/png","Cache-Control":"private, no-store",
      "X-Content-Type-Options":"nosniff","Content-Disposition":"inline; filename=brand-draft-preview.png",
      "X-Brand-Approval-Revision":String(approved.revision)
    }});
  } catch(error) {
    if (error instanceof ContentRenderError)
      return Response.json({error:error.reason},{status:422});
    return Response.json({error:"preview_failed"},{status:500});
  }
}
