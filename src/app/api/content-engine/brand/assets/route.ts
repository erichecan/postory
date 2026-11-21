import { isContentEngineEnabled, unavailableContentEngine } from "@/lib/content-engine/feature-gate";
import { createHash, randomBytes } from "node:crypto";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { ownedContentShop, isContentShopId } from "@/lib/content-engine/shop-access";
import { validateBrandImage, BrandImageValidationError } from "@/lib/content-engine/brand-image-validation";
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
export async function POST(request: NextRequest) {
  if (!isContentEngineEnabled()) return unavailableContentEngine();
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
    let mime: string;
    try { ({mime} = await validateBrandImage(bytes,file.type)); }
    catch (error) {
      if (error instanceof BrandImageValidationError) return Response.json({ error: error.reason }, { status: 422 });
      throw error;
    }
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
