import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getObject, isMediaKey } from "@/lib/storage";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/media/[...key]">) {
  const user = await getCurrentUser();
  if (!user) return new Response(null, { status: 401 });
  const key = (await ctx.params).key.join("/");
  const owner = key.split("/")[1];
  if (!isMediaKey(key) || (owner !== user.id && user.role !== "ADMIN")) return new Response(null, { status: 404 });
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
