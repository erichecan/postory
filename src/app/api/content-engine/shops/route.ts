import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";

export const runtime = "nodejs";
const PRIVATE_HEADERS = { "Cache-Control": "no-store" };
const MAX_SHOPS_PER_ACCOUNT = 40;
function sameOrigin(request: NextRequest) {
  try {
    const origin = request.headers.get("origin");
    const host = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() || request.headers.get("host");
    return !!origin && !!host && new URL(origin).host.toLowerCase() === host.toLowerCase();
  } catch { return false; }
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({error:"login_required"},{status:401});
  const shops = await prisma.contentBrandShop.findMany({
    where:{ownerId:user.id}, select:{id:true,name:true,industry:true,createdAt:true,updatedAt:true},
    orderBy:{createdAt:"asc"}
  });
  return Response.json({shops},{headers:PRIVATE_HEADERS});
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return Response.json({error:"login_required"},{status:401});
  if (!sameOrigin(request)) return Response.json({error:"invalid_origin"},{status:403});
  if (Number(request.headers.get("content-length")||0)>4096) return Response.json({error:"too_large"},{status:413});
  let body:unknown;
  try{body=await request.json()}catch{return Response.json({error:"invalid_json"},{status:400})}
  if (!body || typeof body!=="object") return Response.json({error:"invalid_input"},{status:422});
  const v=body as Record<string,unknown>;
  const name=typeof v.name==="string"?v.name.trim():"";
  if (!name || name.length>120 || v.industry!=="sushi") return Response.json({error:"invalid_shop"},{status:422});
  // A serializable transaction prevents two concurrent requests from bypassing
  // the per-account limit. No delegated agency access is enabled at this stage.
  try{
    const shop=await prisma.$transaction(async tx=>{
      const existing=await tx.contentBrandShop.count({where:{ownerId:user.id}});
      if (existing>=MAX_SHOPS_PER_ACCOUNT) return null;
      return tx.contentBrandShop.create({data:{ownerId:user.id,name,industry:"sushi"},
        select:{id:true,name:true,industry:true,createdAt:true,updatedAt:true}});
    },{isolationLevel:"Serializable"});
    if (!shop) return Response.json({error:"shop_limit"},{status:409});
    return Response.json({shop},{status:201,headers:PRIVATE_HEADERS});
  }catch{return Response.json({error:"create_failed"},{status:500});}
}
