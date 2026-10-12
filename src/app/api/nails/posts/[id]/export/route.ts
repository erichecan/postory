import { getCurrentUser } from "@/lib/auth/session";
import { findStudioForOwner } from "@/lib/db/studios";
import { createNailsPostExport } from "@/lib/db/nails-posts";
import { deleteObject, nailsExportKey, putObject } from "@/lib/storage";

const MAX_EXPORT_BYTES = 8 * 1024 * 1024;

export async function POST(request: Request, ctx: RouteContext<"/api/nails/posts/[id]/export">) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const studio = await findStudioForOwner(user.id);
  const id = (await ctx.params).id;
  if (!studio || !/^[a-z0-9]{10,40}$/i.test(id)) return Response.json({ error: "Not found" }, { status: 404 });
  const form = await request.formData().catch(() => null);
  const file = form?.get("image");
  if (!(file instanceof File) || file.type !== "image/png" || file.size < 8 || file.size > MAX_EXPORT_BYTES) return Response.json({ error: "Invalid image" }, { status: 400 });
  const bytes = Buffer.from(await file.arrayBuffer());
  if (!Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).equals(bytes.subarray(0, 8))) return Response.json({ error: "Invalid image" }, { status: 400 });
  const key = nailsExportKey(studio.id, id);
  try {
    await putObject(key, bytes);
    const saved = await createNailsPostExport(user.id, studio.id, id, key);
    if (!saved) { await deleteObject(key).catch(() => null); return Response.json({ error: "Not found" }, { status: 404 }); }
    return Response.json({ ok: true });
  } catch (error) {
    await deleteObject(key).catch(() => null);
    console.error("Nails post export persistence failed", error instanceof Error ? error.name : "Unknown error");
    return Response.json({ error: "Could not save export" }, { status: 500 });
  }
}
