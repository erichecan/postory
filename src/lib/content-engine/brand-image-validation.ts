import sharp from "sharp";

/**
 * Validate a user-provided, private photographic asset.
 * Always inspect actual decoded pixels, never trust filename or HTTP MIME.
 * The original bytes remain private; rendering/optimisation is a later step.
 */
export const MAX_BRAND_IMAGE_BYTES = 6 * 1024 * 1024;
export const MAX_BRAND_IMAGE_PIXELS = 16_000_000;
export const MAX_BRAND_IMAGE_EDGE = 6000;
export type BrandImageMime = "image/jpeg" | "image/png" | "image/webp";

export class BrandImageValidationError extends Error {
  constructor(public readonly reason: string) {
    super(reason);
    this.name = "BrandImageValidationError";
  }
}

function magicMime(bytes: Buffer): BrandImageMime | null {
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return "image/png";
  if (bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return "image/jpeg";
  if (bytes.length >= 12 && bytes.subarray(0,4).toString("ascii")==="RIFF" && bytes.subarray(8,12).toString("ascii")==="WEBP") return "image/webp";
  return null;
}

export async function validateBrandImage(bytes: Buffer, claimedMime: string): Promise<{
  mime: BrandImageMime;
  width: number;
  height: number;
}> {
  if (bytes.length < 100 || bytes.length > MAX_BRAND_IMAGE_BYTES) throw new BrandImageValidationError("invalid_file_size");
  const mime = magicMime(bytes);
  if (!mime || mime !== claimedMime) throw new BrandImageValidationError("invalid_image_type");
  try {
    // Read metadata first; no pixel decoding occurs during this step.
    // Enforce size limits before constructing a decoder for the full raster.
    const meta = await sharp(bytes, { failOn: "error", limitInputPixels: 0 }).metadata();
    const formatMime = meta.format === "png" ? "image/png" : meta.format === "jpeg" ? "image/jpeg" : meta.format === "webp" ? "image/webp" : null;
    if (formatMime !== mime) throw new BrandImageValidationError("invalid_image_type");
    if (!meta.width || !meta.height || meta.width > MAX_BRAND_IMAGE_EDGE || meta.height > MAX_BRAND_IMAGE_EDGE ||
        meta.width * meta.height > MAX_BRAND_IMAGE_PIXELS || (meta.pages ?? 1) !== 1) {
      throw new BrandImageValidationError("image_dimensions_exceeded");
    }
    // stats() forces the image decoder through the actual pixel data, not
    // merely a signature/header check. Sharp is bounded by limitInputPixels.
    await sharp(bytes, { failOn: "error", limitInputPixels: MAX_BRAND_IMAGE_PIXELS }).stats();
    return {mime,width:meta.width,height:meta.height};
  } catch (error) {
    if (error instanceof BrandImageValidationError) throw error;
    throw new BrandImageValidationError("image_decode_failed");
  }
}
