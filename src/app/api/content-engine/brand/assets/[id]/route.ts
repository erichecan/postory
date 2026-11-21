import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { getObject, parseContentBrandMediaKey } from "@/lib/storage";

export const runtime = "nodejs";
export async function GET(_request: NextRequest, context: RouteContext<"/api/content-engine/brand/assets/[id]">) {
  const user = await getCurrentUser();
  if (!user) return new Response(null, { status: 401 });
  const { id } = await context.params;
  if (!/^[a-f0-9]{24}$/.test(id)) return new Response(null, { status: 404 });
  const asset = await prisma.contentBrandAsset.findFirst({ where: { id, shop: { ownerId: user.id } } });
  if (!asset) return new Response(null, { status: 404 });
  const parsed = parseContentBrandMediaKey(asset.key);
  if (!parsed || parsed.ownerId !== asset.shopId || parsed.assetId !== id) return new Response(null, { status: 404 });
  const object = await getObject(asset.key);
  if (!object) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(object.bytes), {
    headers: {
      "Content-Type": object.mime,
      "Content-Length": String(object.bytes.length),
      "Cache-Control": "private, max-age=300",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}
