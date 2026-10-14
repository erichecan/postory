import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { isIP } from "node:net";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/client";

export const DEMO_VISITOR_COOKIE = "postory_demo_trial";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export type DemoTrialIdentity = { visitorHash: string; ipHash: string };
export type DemoTrialReservation = { ok: true; id: string; quality: "medium" } | { ok: false; reason: "alreadyUsed" | "dailyCap" | "overrideInvalid" };

function secret() {
  const value = process.env.DEMO_TRIAL_HASH_SECRET || (process.env.NODE_ENV === "production" ? undefined : process.env.AUTH_SECRET);
  if (!value || value.length < 32) throw new Error("DEMO_TRIAL_HASH_SECRET must be set to at least 32 characters");
  return value;
}

function digest(scope: string, value: string) {
  return createHmac("sha256", secret()).update(`${scope}:${value}`).digest("hex");
}

function parseVisitorCookie(value: string | undefined) {
  if (!value) return null;
  const [id, signature, extra] = value.split(".");
  if (!id || !signature || extra || !/^[a-f0-9-]{36}$/i.test(id)) return null;
  const expected = digest("visitor-cookie", id);
  const a = Buffer.from(signature, "hex");
  const b = Buffer.from(expected, "hex");
  return a.length === b.length && timingSafeEqual(a, b) ? id : null;
}

export async function getDemoTrialIdentity(request: NextRequest, requestId?: string): Promise<DemoTrialIdentity | null> {
  const trustedHeader = (process.env.DEMO_TRUSTED_IP_HEADER || "cf-connecting-ip").toLowerCase();
  const headerValue = request.headers.get(trustedHeader)?.trim();
  let ip: string | undefined;
  let ipDiagnostic: Record<string, unknown> = {
    configuredHeader: trustedHeader,
    headerPresent: Boolean(headerValue),
  };
  if (trustedHeader === "x-forwarded-for" && headerValue) {
    const chain = headerValue.split(",").map((value) => value.trim());
    // Cloud Run normally appends its observed client address and proxy hop.
    // Use the address immediately before that final hop; some request paths
    // provide a single Cloud Run-asserted address instead of a two-item chain.
    const clientCandidate = chain.length >= 2 ? chain.at(-2) : chain[0];
    const candidateValid = Boolean(clientCandidate && isIP(clientCandidate));
    if (candidateValid) ip = clientCandidate;
    ipDiagnostic = {
      ...ipDiagnostic,
      chainLength: chain.length,
      validAddressCount: chain.filter((value) => isIP(value)).length,
      selectedPosition: chain.length >= 2 ? "before-final-proxy" : "single-value",
      selectedAddressValid: candidateValid,
    };
  } else if (headerValue && !headerValue.includes(",") && isIP(headerValue)) {
    ip = headerValue;
    ipDiagnostic = { ...ipDiagnostic, chainLength: 1, validAddressCount: 1, selectedPosition: "single-value", selectedAddressValid: true };
  }
  if (!ip && process.env.NODE_ENV !== "production") ip = "127.0.0.1";
  if (!ip || ip.length > 64) {
    console.warn(JSON.stringify({ event: "demo_client_ip_unavailable", requestId, ...ipDiagnostic }));
    return null;
  }

  const jar = await cookies();
  const current = parseVisitorCookie(jar.get(DEMO_VISITOR_COOKIE)?.value);
  const visitorId = current ?? randomBytes(18).toString("hex");
  if (!current) {
    const id = visitorId;
    jar.set(DEMO_VISITOR_COOKIE, `${id}.${digest("visitor-cookie", id)}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: COOKIE_MAX_AGE_SECONDS,
    });
  }

  return { visitorHash: digest("visitor", visitorId), ipHash: digest("ip", ip) };
}

function dailyLimit() {
  const value = Number.parseInt(process.env.DEMO_DAILY_GENERATION_LIMIT ?? "10", 10);
  return Number.isFinite(value) && value > 0 ? Math.min(value, 100) : 10;
}

export async function reserveDemoGeneration(input: {
  identity: DemoTrialIdentity;
  industry: "nails" | "sushi";
  idempotencyKey: string;
  overrideToken?: string;
}): Promise<DemoTrialReservation> {
  const overrideHash = input.overrideToken ? digest("override", input.overrideToken) : null;
  return prisma.$transaction(async (tx) => {
    // Serialize requests for this visitor and IP, including requests arriving on different app instances.
    const lockKeys = [`visitor:${input.identity.visitorHash}`, `ip:${input.identity.ipHash}`].sort();
    // Advisory lock functions return PostgreSQL `void`; executeRaw avoids
    // asking Prisma to deserialize that unsupported result type.
    for (const key of lockKeys) await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${key}))`;
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('demo-trial-daily-cap'))`;

    const existing = await tx.demoTrialGeneration.findFirst({
      where: { OR: [{ visitorHash: input.identity.visitorHash }, { ipHash: input.identity.ipHash }] },
      select: { id: true },
    });

    const dayStart = new Date();
    dayStart.setUTCHours(0, 0, 0, 0);
    const count = await tx.demoTrialGeneration.count({ where: { createdAt: { gte: dayStart } } });
    if (count >= dailyLimit()) return { ok: false, reason: "dailyCap" };

    let overrideId: string | null = null;
    if (overrideHash) {
      const now = new Date();
      const override = await tx.demoTrialOverride.findUnique({ where: { tokenHash: overrideHash }, select: { id: true, expiresAt: true, consumedAt: true } });
      if (override && !override.consumedAt && override.expiresAt > now) {
        const claimed = await tx.demoTrialOverride.updateMany({ where: { id: override.id, consumedAt: null, expiresAt: { gt: now } }, data: { consumedAt: now } });
        if (claimed.count === 1) overrideId = override.id;
      }
      if (!overrideId && existing) return { ok: false, reason: "overrideInvalid" };
    }

    if (existing && !overrideId) return { ok: false, reason: "alreadyUsed" };
    const idempotencyKey = digest("idempotency", input.idempotencyKey);
    try {
      const row = await tx.demoTrialGeneration.create({
        data: {
          industry: input.industry,
          visitorHash: input.identity.visitorHash,
          ipHash: input.identity.ipHash,
          idempotencyKey,
          quality: "medium",
        },
        select: { id: true },
      });
      return { ok: true, id: row.id, quality: "medium" };
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
        return { ok: false, reason: "alreadyUsed" };
      }
      throw error;
    }
  }, { isolationLevel: "Serializable" });
}

export async function completeDemoGeneration(id: string, costMicros: number) {
  await prisma.demoTrialGeneration.update({ where: { id }, data: { status: "SUCCEEDED", costMicros, completedAt: new Date() } });
}

export async function failDemoGeneration(id: string) {
  // A reserved attempt stays consumed after an upstream request: retries could incur another provider charge.
  await prisma.demoTrialGeneration.updateMany({ where: { id, status: "RESERVED" }, data: { status: "FAILED", completedAt: new Date() } });
}

export async function issueDemoTrialOverride(input: { createdById: string; reason?: string }) {
  const token = randomBytes(24).toString("base64url");
  const tokenHash = digest("override", token);
  const expiresAt = new Date(Date.now() + 15 * 60_000);
  await prisma.demoTrialOverride.create({ data: { tokenHash, createdById: input.createdById, reason: input.reason?.slice(0, 255) || null, expiresAt } });
  return { token, expiresAt };
}
