import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

function signature(userId: string) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is required to create partner referral links");
  return createHmac("sha256", secret).update(`restaurant-referral:${userId}`).digest("base64url");
}

export function createPartnerReferralToken(userId: string) {
  const payload = Buffer.from(userId).toString("base64url");
  return `${payload}.${signature(userId)}`;
}

export function verifyPartnerReferralToken(token: string | undefined): string | null {
  if (!token || token.length > 256) return null;
  const [payload, supplied, extra] = token.split(".");
  if (!payload || !supplied || extra) return null;
  try {
    const userId = Buffer.from(payload, "base64url").toString("utf8");
    if (!/^[a-z0-9]{10,40}$/i.test(userId)) return null;
    const expected = Buffer.from(signature(userId));
    const actual = Buffer.from(supplied);
    return expected.length === actual.length && timingSafeEqual(expected, actual) ? userId : null;
  } catch {
    return null;
  }
}
