import { getCurrentUser } from "@/lib/auth/session";
import { getNailsPostExport } from "@/lib/db/nails-posts";
import { findStudioForOwner } from "@/lib/db/studios";
import { getObject } from "@/lib/storage";

export async function GET(_request: Request, ctx: RouteContext<"/api/nails/exports/[id]">) {
  const user = await getCurrentUser();
  if (!user) return new Response(null, { status: 401 });
  const studio = await findStudioForOwner(user.id);
  const id = (await ctx.params).id;
  if (!studio || !/^[a-z0-9]{10,40}$/i.test(id)) return new Response(null, { status: 404 });
  const record = await getNailsPostExport(user.id, studio.id, id);
  if (!record) return new Response(null, { status: 404 });
  const object = await getObject(record.storageKey);
  if (!object) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(object.bytes), { headers: { "Content-Type": "image/png", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}
