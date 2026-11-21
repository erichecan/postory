import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { isContentEngineEnabled, unavailableContentEngine } from "@/lib/content-engine/feature-gate";
import { loadApprovedBrandPhoto, loadApprovedBrandSnapshot } from "@/lib/content-engine/approved-snapshot";
import {
  createApprovedContentManifest, isApprovedContentManifest, parseContentApprovalInput,
} from "@/lib/content-engine/content-approval";
import { ContentRenderError, renderContentMedia } from "@/lib/content-engine/deterministic-renderer";

export const runtime="nodejs";
const HEADERS={"Cache-Control":"private, no-store"};
const CONTENT_APPROVAL_EVENT="content_approved_by_merchant";

function sameOrigin(request:NextRequest) {
  try {
    const origin=request.headers.get("origin");
    const host=request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() || request.headers.get("host");
    return !!origin && !!host && new URL(origin).host.toLowerCase()===host.toLowerCase();
  } catch {return false;}
}

/** Authenticated shop owner attests exact copy + image + layout; no auto-post. */
export async function POST(request:NextRequest) {
  if (!isContentEngineEnabled()) return unavailableContentEngine();
  const user=await getCurrentUser();
  if (!user) return Response.json({error:"login_required"},{status:401,headers:HEADERS});
  if (!sameOrigin(request)) return Response.json({error:"invalid_origin"},{status:403,headers:HEADERS});
  if (Number(request.headers.get("content-length")||0)>4096)
    return Response.json({error:"too_large"},{status:413,headers:HEADERS});
  let raw:unknown;
  try {raw=await request.json();} catch{return Response.json({error:"invalid_json"},{status:400,headers:HEADERS});}
  const input=parseContentApprovalInput(raw);
  const consent=raw && typeof raw==="object" && !Array.isArray(raw) &&
    (raw as Record<string,unknown>).confirmExactContent===true;
  if (!input || !consent) return Response.json({error:"content_confirmation_required"},{status:422,headers:HEADERS});
  const approved=await loadApprovedBrandSnapshot(user.id,input.shopId);
  if (!approved || approved.approvalEventId!==input.brandApprovalEventId ||
      approved.revision!==input.brandRevision)
    return Response.json({error:"brand_approval_mismatch"},{status:409,headers:HEADERS});
  const photo=await loadApprovedBrandPhoto(user.id,input.shopId,approved.profile,input.assetId);
  if (!photo) return Response.json({error:"approved_asset_not_found"},{status:404,headers:HEADERS});
  // The renderer validates layout/brand and the actual source photo before an
  // authorization event is written. Only an exact approved manifest may export.
  try {
    await renderContentMedia({
      profile:approved.profile,photo,sourceAssetId:input.assetId,
      template:input.template,format:input.format,headline:input.headline,
      subheadline:input.subheadline,cta:input.cta,mode:"publish"
    });
  } catch(error) {
    if (error instanceof ContentRenderError)
      return Response.json({error:error.reason},{status:422,headers:HEADERS});
    return Response.json({error:"validation_failed"},{status:500,headers:HEADERS});
  }
  const manifest=createApprovedContentManifest(input,user.id,new Date().toISOString());
  try {
    const event=await prisma.contentBrandReviewEvent.create({
      data:{shopId:input.shopId,actorUserId:user.id,event:CONTENT_APPROVAL_EVENT,
        revision:input.brandRevision,snapshot:manifest},
      select:{id:true,createdAt:true}
    });
    return Response.json({ok:true,contentApprovalId:event.id,brandRevision:input.brandRevision},
      {status:201,headers:HEADERS});
  } catch {
    return Response.json({error:"approval_save_failed"},{status:500,headers:HEADERS});
  }
}

/** Return publish-ready PNG ONLY for an immutable, server-recorded merchant approval. */
export async function GET(request:NextRequest) {
  if (!isContentEngineEnabled()) return unavailableContentEngine();
  const user=await getCurrentUser();
  if (!user) return Response.json({error:"login_required"},{status:401,headers:HEADERS});
  const id=request.nextUrl.searchParams.get("contentApprovalId");
  if (!id || !/^[a-z0-9]{10,40}$/.test(id))
    return Response.json({error:"invalid_approval_id"},{status:422,headers:HEADERS});
  const record=await prisma.contentBrandReviewEvent.findFirst({
    where:{id,event:CONTENT_APPROVAL_EVENT,shop:{ownerId:user.id}},
    select:{shopId:true,revision:true,snapshot:true,actorUserId:true}
  });
  if (!record || !isApprovedContentManifest(record.snapshot))
    return Response.json({error:"approval_not_found"},{status:404,headers:HEADERS});
  const manifest=record.snapshot;
  if (record.shopId!==manifest.shopId || record.revision!==manifest.brandRevision ||
      record.actorUserId!==manifest.approvedBy)
    return Response.json({error:"approval_inconsistent"},{status:409,headers:HEADERS});
  const brand=await loadApprovedBrandSnapshot(user.id,record.shopId);
  // If the brand was re-approved later, require new approval of the exact content.
  if (!brand || brand.approvalEventId!==manifest.brandApprovalEventId ||
      brand.revision!==manifest.brandRevision)
    return Response.json({error:"brand_approval_changed"},{status:409,headers:HEADERS});
  const photo=await loadApprovedBrandPhoto(user.id,record.shopId,brand.profile,manifest.assetId);
  if (!photo) return Response.json({error:"approved_asset_not_found"},{status:404,headers:HEADERS});
  try {
    const output=await renderContentMedia({
      profile:brand.profile,photo,sourceAssetId:manifest.assetId,
      template:manifest.template,format:manifest.format,headline:manifest.headline,
      subheadline:manifest.subheadline,cta:manifest.cta,mode:"publish"
    });
    return new Response(new Uint8Array(output.bytes),{headers:{
      ...HEADERS,"Content-Type":"image/png","X-Content-Type-Options":"nosniff",
      "Content-Disposition":"attachment; filename=postory-approved.png"
    }});
  } catch(error) {
    if (error instanceof ContentRenderError)
      return Response.json({error:error.reason},{status:422,headers:HEADERS});
    return Response.json({error:"export_failed"},{status:500,headers:HEADERS});
  }
}
