import { createHash } from "node:crypto";
import sharp from "sharp";

/** Validate the exact rasterized bytes which will be given to the publisher.
 * This is NOT OCR: corrupted or missing-glyph text still requires visual sign-off.
 */
export async function inspectPublishRaster(bytes: Buffer): Promise<{
  sha256: string; width: number; height: number; mime: string;
}> {
  if (!bytes.length || bytes.length > 20 * 1024 * 1024) throw new Error("image_size_invalid");
  const meta = await sharp(bytes, { failOn: "error", limitInputPixels: 40_000_000 }).metadata();
  const type = meta.format;
  if (type !== "png" && type !== "jpeg" && type !== "webp") throw new Error("unsupported_image_format");
  if (!meta.width || !meta.height || meta.width < 320 || meta.height < 320 || meta.width > 8000 || meta.height > 8000) throw new Error("image_dimensions_invalid");
  // Force actual decode so valid headers on corrupted files cannot pass review.
  await sharp(bytes, { failOn: "error", limitInputPixels: 40_000_000 }).stats();
  return {
    sha256: createHash("sha256").update(bytes).digest("hex"),
    width: meta.width, height: meta.height,
    mime: type === "jpeg" ? "image/jpeg" : `image/${type}`,
  };
}

export function captionSha256(caption: string) {
  return createHash("sha256").update(caption, "utf8").digest("hex");
}

export function requireExactApproval(input: {
  expectedImageSha: string | null;
  actualImageSha: string;
  expectedCaptionSha: string | null;
  actualCaption: string;
  approvedAt: Date | null;
}) {
  if (!input.approvedAt || !input.expectedImageSha || input.expectedImageSha !== input.actualImageSha ||
      !input.expectedCaptionSha || input.expectedCaptionSha !== captionSha256(input.actualCaption))
    throw new Error("approved_asset_changed_or_missing");
}
