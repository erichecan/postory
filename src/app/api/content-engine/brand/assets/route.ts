import { createHash, randomBytes } from "node:crypto";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { ownedContentShop, isContentShopId } from "@/lib/content-engine/shop-access";
import { contentBrandMediaKey, contentBrandMediaUrl, deleteObject, putObject } from "@/lib/storage";

export const runtime = "nodejs";
const MAX_FILE = 6 * 1024 * 1024;
const KINDS = new Set(["logo", "store", "product"]);
function validOrigin(request: NextRequest) {
  try {
    const origin = request.headers.get("origin");
    const host = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() || request.headers.get("host");
    return !!origin && !!host && new URL(origin).host.toLowerCase() === host.toLowerCase();
  } catch { return false; }
}
function detectMime(bytes: Buffer): string | null {
  if (bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return "image/png";
  if (bytes.length > 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return "image/jpeg";
  if (bytes.subarray(0,4).toString() === "RIFF" && bytes.subarray(8,12).toString() === "WEBP") return "image/webp";
  return null;
}
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "login_required" }, { status: 401 });
  if (!validOrigin(request)) return Response.json({ error: "invalid_origin" }, { status: 403 });
  if (Number(request.headers.get("content-length") || 0) > MAX_FILE + 1024 * 64) return Response.json({ error: "too_large" }, { status: 413 });
  try {
    const form = await request.formData();
    const shopId=form.get("shopId");
    if (!isContentShopId(shopId)) return Response.json({ error: "invalid_shop" }, { status: 422 });
    const shop=await ownedContentShop(user.id,shopId);
    if (!shop || shop.industry!=="sushi") return Response.json({ error: "shop_not_found" }, { status: 404 });
    const kind = form.get("kind");
    const file = form.get("file");
    if (typeof kind !== "string" || !KINDS.has(kind) || !(file instanceof File)) return Response.json({ error: "invalid_input" }, { status: 422 });
    if (file.size < 100 || file.size > MAX_FILE) return Response.json({ error: "too_large" }, { status: 413 });
    const currentCount = await prisma.contentBrandAsset.count({ where: { shopId, kind } });
    const limit = kind === "logo" ? 5 : kind === "store" ? 15 : 20;
    if (currentCount >= limit) return Response.json({ error: "asset_limit" }, { status: 409 });
    const bytes = Buffer.from(await file.arrayBuffer());
    const mime = detectMime(bytes);
    if (!mime || mime !== file.type) return Response.json({ error: "invalid_image_type" }, { status: 415 });
    const id = randomBytes(12).toString("hex");
    const key = contentBrandMediaKey(shopId,id,mime);
    await putObject(key, bytes);
    try {
      await prisma.contentBrandAsset.create({
        data: { id, shopId, kind, key, mime, sha256: createHash("sha256").update(bytes).digest("hex"), byteSize: bytes.length },
      });
    } catch (error) {
      await deleteObject(key).catch(() => undefined);
      throw error;
    }
    return Response.json({ id, kind, url: contentBrandMediaUrl(id), name: file.name.slice(0,180) }, { status: 201 });
  } catch {
    return Response.json({ error: "upload_failed" }, { status: 500 });
  }
}
