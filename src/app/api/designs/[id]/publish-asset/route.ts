import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getOwnDesign } from "@/lib/db/designs";
import { decodeUpload } from "@/lib/ai/image-bytes";
import { publicMediaKey, publicMediaUrl, putObject } from "@/lib/storage";

const ID_PATTERN = /^[a-z0-9]{10,40}$/;

export async function POST(req: NextRequest, ctx: RouteContext<"/api/designs/[id]/publish-asset">) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false }, { status: 401 });
  const { id } = await ctx.params;
  if (!ID_PATTERN.test(id)) return Response.json({ ok: false }, { status: 404 });
  const design = await getOwnDesign(user.id, id);
  if (!design) return Response.json({ ok: false }, { status: 404 });

  const body = await req.json().catch(() => null);
  const dataUrl = body && typeof body === "object" && "dataUrl" in body ? String(body.dataUrl) : "";
  const decoded = decodeUpload(dataUrl);
  if (!decoded.ok) return Response.json({ ok: false, reason: decoded.error }, { status: 422 });

  const key = publicMediaKey(user.id, design.id, decoded.mime);
  await putObject(key, decoded.bytes);
  return Response.json({ ok: true, url: publicMediaUrl(key) });
}
