import { UPLOAD_MAX_BYTES } from "@/components/create/studio-options";

export type UploadError = "badType" | "tooLarge";

function sniffMime(buf: Buffer) {
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.length >= 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  return null;
}

export function decodeUpload(dataUrl: string): { ok: true; bytes: Buffer; mime: string } | { ok: false; error: UploadError } {
  const m = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!m) return { ok: false, error: "badType" };
  if ((m[2].length * 3) / 4 > UPLOAD_MAX_BYTES + 4) return { ok: false, error: "tooLarge" };
  const bytes = Buffer.from(m[2], "base64");
  if (bytes.length > UPLOAD_MAX_BYTES) return { ok: false, error: "tooLarge" };
  const mime = sniffMime(bytes);
  if (!mime) return { ok: false, error: "badType" };
  return { ok: true, bytes, mime };
}
