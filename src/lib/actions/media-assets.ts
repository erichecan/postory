"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { decodeUpload } from "@/lib/ai/image-bytes";
import { createMediaAssetForOwner, deleteMediaAssetForOwner } from "@/lib/db/media-assets";
import { getNailsWorkspace } from "@/lib/nails/workspace";
import { deleteObject, nailsMediaKey, nailsMediaUrl, putObject } from "@/lib/storage";

const MAX_PHOTOS_PER_BATCH = 5;

const photoSchema = z.object({
  dataUrl: z.string().max(16 * 1024 * 1024),
  width: z.number().int().positive().max(20_000),
  height: z.number().int().positive().max(20_000),
});

const batchSchema = z.array(photoSchema).min(1).max(MAX_PHOTOS_PER_BATCH);

export type UploadedMediaAsset = { id: string; url: string; width: number; height: number };
export type UploadItemResult = { ok: true; asset: UploadedMediaAsset } | { ok: false; error: string };

export async function uploadMediaAssetsAction(photos: unknown): Promise<{ ok: true; items: UploadItemResult[] } | { ok: false; error: string }> {
  const { user, studio } = await getNailsWorkspace();
  const t = await getTranslations("nails");
  const parsed = batchSchema.safeParse(photos);
  if (!parsed.success) return { ok: false, error: t("mediaTooMany", { max: MAX_PHOTOS_PER_BATCH }) };

  const items: UploadItemResult[] = [];
  for (const photo of parsed.data) {
    const decoded = decodeUpload(photo.dataUrl);
    if (!decoded.ok) {
      items.push({ ok: false, error: t(decoded.error === "tooLarge" ? "mediaTooLarge" : "mediaBadType") });
      continue;
    }
    const id = crypto.randomUUID().replace(/-/g, "");
    const key = nailsMediaKey(studio.id, id, decoded.mime);
    try {
      await putObject(key, decoded.bytes);
    } catch (error) {
      console.error("Media asset storage failed", error instanceof Error ? error.name : "Unknown error");
      items.push({ ok: false, error: t("mediaUploadFailed") });
      continue;
    }
    try {
      const created = await createMediaAssetForOwner(user.id, studio.id, {
        id,
        key,
        mimeType: decoded.mime,
        byteSize: decoded.bytes.length,
        width: photo.width,
        height: photo.height,
      });
      items.push({ ok: true, asset: { id: created.id, url: nailsMediaUrl(key), width: created.width, height: created.height } });
    } catch (error) {
      console.error("Media asset create failed", error instanceof Error ? error.name : "Unknown error");
      await deleteObject(key).catch(() => null);
      items.push({ ok: false, error: t("mediaUploadFailed") });
    }
  }

  if (items.some((item) => item.ok)) revalidatePath("/nails/create");
  return { ok: true, items };
}

export async function deleteMediaAssetAction(assetId: string): Promise<{ ok: boolean }> {
  const { user, studio } = await getNailsWorkspace();
  const parsedId = z.string().min(1).max(64).safeParse(assetId);
  if (!parsedId.success) return { ok: false };
  const deleted = await deleteMediaAssetForOwner(user.id, studio.id, parsedId.data);
  if (!deleted) return { ok: false };
  try {
    await deleteObject(deleted.key);
  } catch (error) {
    console.error("Media asset storage delete failed", error instanceof Error ? error.name : "Unknown error");
  }
  revalidatePath("/nails/create");
  return { ok: true };
}
