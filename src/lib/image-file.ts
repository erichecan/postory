export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
const MAX_ENCODED_CHARS = 2 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_EDGE = 1600;

export type ImageErrorKey = "imageFormat" | "uploadTooLarge" | "imageReadFailed" | "imageProcessFailed";

export class ImageFileError extends Error {
  constructor(public key: ImageErrorKey) {
    super(key);
  }
}

export function imageErrorKey(err: unknown): ImageErrorKey {
  return err instanceof ImageFileError ? err.key : "imageReadFailed";
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new ImageFileError("imageReadFailed"));
    };
    img.src = url;
  });
}

export async function readImageFile(file: File): Promise<string> {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) throw new ImageFileError("imageFormat");
  if (file.size > MAX_UPLOAD_BYTES) throw new ImageFileError("uploadTooLarge");
  const img = await loadImage(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new ImageFileError("imageProcessFailed");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const webp = canvas.toDataURL("image/webp", 0.85);
  if (webp.startsWith("data:image/webp")) return webp;
  const png = canvas.toDataURL("image/png");
  return png.length <= MAX_ENCODED_CHARS ? png : canvas.toDataURL("image/jpeg", 0.85);
}
