import "server-only";
import { createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { prisma } from "./client";

type Purpose = "verify" | "reset" | "login";

export const CODE_TTL_MS = 15 * 60 * 1000;
export const RESET_TTL_MS = 30 * 60 * 1000;
export const RESEND_COOLDOWN_MS = 60 * 1000;
export const MAX_SENDS_PER_HOUR = 5;
export const MAX_CODE_ATTEMPTS = 5;

function digest(purpose: Purpose, email: string, secret: string) {
  const key = process.env.AUTH_SECRET;
  if (!key) throw new Error("AUTH_SECRET missing");
  return createHmac("sha256", key).update(`${purpose}:${email}:${secret}`).digest("hex");
}

function same(a: string, b: string) {
  const x = Buffer.from(a, "hex");
  const y = Buffer.from(b, "hex");
  return x.length === y.length && timingSafeEqual(x, y);
}

export type IssueResult = { ok: true; secret: string } | { ok: false; reason: "cooldown" | "rateLimited"; retryAfterSec: number };

async function issue(email: string, purpose: Purpose, secret: string, ttl: number, now = new Date()): Promise<IssueResult> {
  return prisma.$transaction(async (tx) => {
    // Serialize sends for an address/purpose so parallel requests cannot bypass limits.
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`${purpose}:${email}`}, 0))::text`;
    const recent = await tx.emailToken.findMany({
      where: { email, purpose, createdAt: { gt: new Date(now.getTime() - 3600 * 1000) } },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });
    const last = recent[0]?.createdAt;
    if (last && now.getTime() - last.getTime() < RESEND_COOLDOWN_MS) {
      return { ok: false, reason: "cooldown", retryAfterSec: Math.ceil((RESEND_COOLDOWN_MS - (now.getTime() - last.getTime())) / 1000) };
    }
    if (recent.length >= MAX_SENDS_PER_HOUR) {
      const oldest = recent[recent.length - 1].createdAt;
      return { ok: false, reason: "rateLimited", retryAfterSec: Math.ceil((oldest.getTime() + 3600 * 1000 - now.getTime()) / 1000) };
    }
    await tx.emailToken.updateMany({ where: { email, purpose, usedAt: null }, data: { usedAt: now } });
    await tx.emailToken.create({ data: { email, purpose, codeHash: digest(purpose, email, secret), expiresAt: new Date(now.getTime() + ttl), createdAt: now } });
    return { ok: true, secret };
  });
}

export function issueLoginCode(email: string) {
  return issue(email, "login", String(randomInt(0, 1_000_000)).padStart(6, "0"), CODE_TTL_MS);
}

export function consumeLoginCode(email: string, code: string) {
  return consume(email, "login", code);
}

export function issueVerifyCode(email: string) {
  return issue(email, "verify", String(randomInt(0, 1_000_000)).padStart(6, "0"), CODE_TTL_MS);
}

export function issueResetToken(email: string) {
  return issue(email, "reset", randomBytes(32).toString("base64url"), RESET_TTL_MS);
}

export type ConsumeResult = "ok" | "invalid" | "expired" | "tooMany";

async function consume(email: string, purpose: Purpose, secret: string, now = new Date()): Promise<ConsumeResult> {
  const token = await prisma.emailToken.findFirst({ where: { email, purpose, usedAt: null }, orderBy: { createdAt: "desc" } });
  if (!token) return "invalid";
  if (token.expiresAt <= now) return "expired";
  const slot = await prisma.emailToken.updateMany({ where: { id: token.id, usedAt: null, attempts: { lt: MAX_CODE_ATTEMPTS } }, data: { attempts: { increment: 1 } } });
  if (slot.count === 0) return "tooMany";
  if (!same(token.codeHash, digest(purpose, email, secret))) {
    return token.attempts + 1 >= MAX_CODE_ATTEMPTS ? "tooMany" : "invalid";
  }
  const claimed = await prisma.emailToken.updateMany({ where: { id: token.id, usedAt: null }, data: { usedAt: now } });
  return claimed.count === 1 ? "ok" : "invalid";
}

export function consumeVerifyCode(email: string, code: string) {
  return consume(email, "verify", code);
}

export function consumeResetToken(email: string, token: string) {
  return consume(email, "reset", token);
}
