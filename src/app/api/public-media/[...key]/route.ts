import type { NextRequest } from "next/server";
import { getObject, isPublicMediaKey } from "@/lib/storage";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/public-media/[...key]">) {
  const key = (await ctx.params).key.join("/");
  if (!isPublicMediaKey(key)) return new Response(null, { status: 404 });
  const obj = await getObject(key);
  if (!obj) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(obj.bytes), {
    headers: {
      "Content-Type": obj.mime,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; img-src data:; style-src 'unsafe-inline'; sandbox",
    },
  });
}
