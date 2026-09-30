import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { isServableMedia } from "@/lib/db/generations";
import { getObject, parseMediaKey } from "@/lib/storage";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/media/[...key]">) {
  const user = await getCurrentUser();
  if (!user) return new Response(null, { status: 401 });
  const key = (await ctx.params).key.join("/");
  const parsed = parseMediaKey(key);
  if (!parsed || (parsed.userId !== user.id && user.role !== "ADMIN")) return new Response(null, { status: 404 });
  if (!(await isServableMedia(parsed.userId, parsed.generationId, parsed.role))) return new Response(null, { status: 404 });
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
