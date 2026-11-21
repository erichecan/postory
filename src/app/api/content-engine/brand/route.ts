import { isContentEngineEnabled, unavailableContentEngine } from "@/lib/content-engine/feature-gate";
import { randomBytes } from "node:crypto";
import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { ownedContentShop, isContentShopId } from "@/lib/content-engine/shop-access";
import { prisma } from "@/lib/db/client";
import { contentBrandMediaUrl } from "@/lib/storage";
import { newBrandProfileDraft, type BrandProfileDraft } from "@/lib/content-engine/brand-profile";

export const runtime = "nodejs";
type ProfileInput = {
  businessName: string; serviceArea: string; locale: "zh" | "en"; tagline: string;
  website: string; voice: "minimal" | "warm" | "bright"; accent: string; assetIds: string[];
};
function validOrigin(request: NextRequest) {
  try {
    const origin = request.headers.get("origin");
    const host = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() || request.headers.get("host");
    return !!origin && !!host && new URL(origin).host.toLowerCase() === host.toLowerCase();
  } catch { return false; }
}
function safeInput(value: unknown): ProfileInput | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  const read = (key: string, limit: number): string => typeof v[key] === "string" ? (v[key] as string).trim().slice(0,limit) : "";
  const businessName = read("businessName",120), serviceArea = read("serviceArea",160);
  const locale = read("locale",2), voice = read("voice",12), accent = read("accent",7);
  if (!businessName || !serviceArea || !["zh","en"].includes(locale) || !["minimal","warm","bright"].includes(voice) || !/^#[a-f0-9]{6}$/i.test(accent)) return null;
  const assetIds = v.assetIds;
  if (!Array.isArray(assetIds) || assetIds.length > 8 || assetIds.some(id=>typeof id !== "string" || !/^[a-f0-9]{24}$/.test(id)) || new Set(assetIds).size !== assetIds.length) return null;
  const website = read("website",240);
  if (website && (!/^https:\/\//i.test(website) || (()=>{try{const u=new URL(website);return !["https:"].includes(u.protocol)}catch{return true}})())) return null;
  return { businessName, serviceArea, locale: locale as "zh" | "en", tagline: read("tagline",150), website, voice: voice as ProfileInput["voice"], accent, assetIds };
}
function exposed(profile: BrandProfileDraft, revision: number) {
  return {
    revision,
    profileId: profile.profileId,
    status: profile.status,
    businessName: profile.businessName.value,
    serviceArea: profile.serviceArea.value,
    locale: profile.preferredLocale.value,
    tagline: profile.positioning?.value || "",
    website: profile.factualClaims.find(c=>c.key==="website")?.fact.value || "",
    voice: profile.writingVoice?.value || "minimal",
    accent: profile.brandColors?.value[0] || "#2F5149",
    assets: profile.assets.map(a=>({ id:a.assetId, kind:a.kind==="interior"?"store":a.kind, url:contentBrandMediaUrl(a.assetId) })),
  };
}
export async function GET(request: NextRequest) {
  if (!isContentEngineEnabled()) return unavailableContentEngine();
  const user = await getCurrentUser();
  if (!user) return Response.json({error:"login_required"},{status:401});
  const shopId = request.nextUrl.searchParams.get("shopId");
  if (!isContentShopId(shopId) || !(await ownedContentShop(user.id,shopId))) return Response.json({error:"shop_not_found"},{status:404});
  const row = await prisma.contentBrandProfile.findUnique({where:{shopId}});
  if (!row) return Response.json({ok:true,profile:null},{headers:{"Cache-Control":"no-store"}});
  return Response.json({ok:true,profile:exposed(row.data as unknown as BrandProfileDraft,row.revision)},{headers:{"Cache-Control":"no-store"}});
}
export async function PUT(request: NextRequest) {
  if (!isContentEngineEnabled()) return unavailableContentEngine();
  const user = await getCurrentUser();
  if (!user) return Response.json({error:"login_required"},{status:401});
  if (!validOrigin(request)) return Response.json({error:"invalid_origin"},{status:403});
  if (Number(request.headers.get("content-length")||0)>20_000) return Response.json({error:"too_large"},{status:413});
  let raw: unknown;
  try { raw=await request.json(); } catch { return Response.json({error:"invalid_json"},{status:400}); }
  const input=safeInput(raw);
  if (!input) return Response.json({error:"invalid_fields"},{status:422});
  const v=raw as Record<string, unknown>;
  const shopId=v.shopId;
  if (!isContentShopId(shopId)) return Response.json({error:"invalid_shop"},{status:422});
  const shop=await ownedContentShop(user.id,shopId);
  if (!shop || shop.industry!=="sushi") return Response.json({error:"shop_not_found"},{status:404});
  const expectedRevision=v.expectedRevision;
  if (expectedRevision !== null && (!Number.isInteger(expectedRevision) || (expectedRevision as number)<1)) return Response.json({error:"invalid_revision"},{status:422});
  const assets=await prisma.contentBrandAsset.findMany({where:{shopId,id:{in:input.assetIds}}});
  if (assets.length!==input.assetIds.length) return Response.json({error:"invalid_asset_ownership"},{status:403});
  const now=new Date().toISOString();
  const existing=await prisma.contentBrandProfile.findUnique({where:{shopId}});
  if (existing && (existing.data as unknown as BrandProfileDraft).status !== "draft") {
    return Response.json({error:"profile_locked_for_review"},{status:409,headers:{"Cache-Control":"no-store"}});
  }
  if ((!existing && expectedRevision!==null) || (existing && existing.revision!==expectedRevision)) {
    return Response.json({error:"revision_conflict"},{status:409});
  }
  const profile=newBrandProfileDraft({
    tenantId:shopId,profileId:existing?.id || randomBytes(12).toString("hex"),industry:"sushi",
    businessName:input.businessName,serviceArea:input.serviceArea,locale:input.locale,now,
  });
  profile.version=existing?existing.revision+1:1;
  profile.writingVoice={value:input.voice,status:"proposed",source:"merchant_form"};
  profile.brandColors={value:[input.accent],status:"proposed",source:"merchant_form"};
  if(input.tagline) profile.positioning={value:input.tagline,status:"proposed",source:"merchant_form"};
  if(input.website) profile.factualClaims.push({key:"website",fact:{value:input.website,status:"proposed",source:"merchant_form"}});
  profile.assets=input.assetIds.map(id=>{
    const asset=assets.find(a=>a.id===id)!;
    return {
      assetId:asset.id, kind:asset.kind==="store"?"interior":asset.kind as "logo"|"product",
      originalStorageKey:asset.key,sha256:asset.sha256,
      sourcePermission:"needs_confirmation" as const,approvedForPublishing:false,
    };
  });
  if(existing){
    const result=await prisma.contentBrandProfile.updateMany({where:{shopId,revision:existing.revision},data:{revision:{increment:1},data:profile as unknown as object}});
    if(!result.count) return Response.json({error:"revision_conflict"},{status:409});
  }else{
    try {
      await prisma.contentBrandProfile.create({data:{id:profile.profileId,shopId,revision:1,data:profile as unknown as object}});
    } catch {
      return Response.json({error:"revision_conflict"},{status:409});
    }
  }
  return Response.json({ok:true,profile:exposed(profile,profile.version)},{headers:{"Cache-Control":"no-store"}});
}
