import type { NextRequest } from "next/server";
import { isPartnersAssetServable, isPartnersRefServable } from "@/lib/db/partner-trials";
import { getObject, isPartnersAssetKey, isPartnersRefKey } from "@/lib/storage";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/partners-media/[...key]">) {
  const key = (await ctx.params).key.join("/");
  const servable = isPartnersRefKey(key)
    ? await isPartnersRefServable(key)
    : isPartnersAssetKey(key)
      ? await isPartnersAssetServable(key)
      : false;
  if (!servable) return new Response(null, { status: 404 });
  const obj = await getObject(key);
  if (!obj) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(obj.bytes), {
    headers: {
      "Content-Type": obj.mime,
      "Cache-Control": "private, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; img-src data:; style-src 'unsafe-inline'; sandbox",
    },
  });
}
