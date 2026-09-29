import "server-only";
import { cache } from "react";
import { prisma } from "./client";
import type { ChargeKind, GrantScope, GrantSource, GrantUnit, Prisma } from "@/generated/prisma/client";
import { CHARGE_CREDITS } from "@/lib/billing/plan-math";
import type { BalanceView, TxnView } from "@/types/commerce";

type Tx = Prisma.TransactionClient;
type Allocation = { grantId: string; amount: number };

export type ChargeResult =
  | { ok: true; charged: number; txnId: string; duplicate: boolean }
  | { ok: false; reason: "insufficient"; need: number; have: number };

export const TXN_PAGE_SIZE = 24;

function activeWhere(userId: string, unit: GrantUnit, now: Date): Prisma.CreditGrantWhereInput {
  return { userId, unit, validFrom: { lte: now }, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] };
}

async function lockUser(tx: Tx, userId: string) {
  await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;
}

async function spendableGrants(tx: Tx, userId: string, scopes: GrantScope[], now: Date) {
  const grants = await tx.creditGrant.findMany({
    where: { ...activeWhere(userId, "CREDIT", now), remaining: { gt: 0 }, scope: { in: scopes } },
    orderBy: [{ expiresAt: { sort: "asc", nulls: "last" } }, { createdAt: "asc" }],
    select: { id: true, remaining: true, scope: true },
  });
  return grants.sort((a, b) => Number(b.scope === "TEMPLATE_ONLY") - Number(a.scope === "TEMPLATE_ONLY"));
}

async function allocate(tx: Tx, grants: { id: string; remaining: number }[], need: number): Promise<Allocation[]> {
  const allocations: Allocation[] = [];
  let left = need;
  for (const g of grants) {
    if (left === 0) break;
    const take = Math.min(g.remaining, left);
    await tx.creditGrant.update({ where: { id: g.id }, data: { remaining: { decrement: take } } });
    allocations.push({ grantId: g.id, amount: take });
    left -= take;
  }
  return allocations;
}

export function chargeScopes(charge: ChargeKind): GrantScope[] {
  return charge === "TEMPLATE_EXPORT" ? ["TEMPLATE_ONLY", "ANY"] : ["ANY"];
}

export async function chargeCredits(userId: string, charge: ChargeKind, refId: string, now = new Date()): Promise<ChargeResult> {
  const need = CHARGE_CREDITS[charge];
  return prisma.$transaction(async (tx) => {
    await lockUser(tx, userId);
    const existing = await tx.creditTxn.findUnique({ where: { userId_kind_refId: { userId, kind: "DEBIT", refId } } });
    if (existing) return { ok: true, charged: -existing.delta, txnId: existing.id, duplicate: true };

    const grants = await spendableGrants(tx, userId, chargeScopes(charge), now);
    const have = grants.reduce((s, g) => s + g.remaining, 0);
    if (have < need) return { ok: false, reason: "insufficient", need, have };

    const allocations = await allocate(tx, grants, need);
    const txn = await tx.creditTxn.create({ data: { userId, kind: "DEBIT", charge, delta: -need, allocations, refId } });
    return { ok: true, charged: need, txnId: txn.id, duplicate: false };
  });
}

export async function refundCharge(userId: string, refId: string): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    await lockUser(tx, userId);
    const debit = await tx.creditTxn.findUnique({ where: { userId_kind_refId: { userId, kind: "DEBIT", refId } } });
    if (!debit) return false;
    const refunded = await tx.creditTxn.findUnique({ where: { userId_kind_refId: { userId, kind: "REFUND", refId } } });
    if (refunded) return false;
    const allocations = (debit.allocations ?? []) as Allocation[];
    for (const a of allocations) {
      await tx.creditGrant.update({ where: { id: a.grantId }, data: { remaining: { increment: a.amount } } });
    }
    await tx.creditTxn.create({ data: { userId, kind: "REFUND", charge: debit.charge, delta: -debit.delta, allocations, refId } });
    return true;
  });
}

export type GrantInput = {
  userId: string;
  source: GrantSource;
  amount: number;
  unit?: GrantUnit;
  scope?: GrantScope;
  validFrom?: Date;
  expiresAt?: Date | null;
  refId?: string;
  note?: string;
  actorId?: string;
};

async function createGrant(tx: Tx, input: GrantInput) {
  const unit = input.unit ?? "CREDIT";
  const grant = await tx.creditGrant.create({
    data: {
      userId: input.userId,
      unit,
      source: input.source,
      scope: input.scope ?? "ANY",
      amount: input.amount,
      remaining: input.amount,
      validFrom: input.validFrom ?? new Date(),
      expiresAt: input.expiresAt ?? null,
      refId: input.refId ?? null,
    },
  });
  if (unit === "CREDIT") {
    await tx.creditTxn.create({
      data: { userId: input.userId, kind: "GRANT", source: input.source, delta: input.amount, refId: grant.id, note: input.note ?? null, actorId: input.actorId ?? null, createdAt: grant.validFrom },
    });
  }
  return grant;
}

export async function grantCredits(input: GrantInput) {
  if (input.amount <= 0 || !Number.isInteger(input.amount)) throw new Error("grant amount must be a positive integer");
  return prisma.$transaction(async (tx) => {
    await lockUser(tx, input.userId);
    if (input.refId) {
      const existing = await tx.creditGrant.findUnique({ where: { refId: input.refId } });
      if (existing) return { grant: existing, duplicate: true };
    }
    return { grant: await createGrant(tx, input), duplicate: false };
  });
}

export async function grantMany(inputs: GrantInput[]) {
  if (inputs.length === 0) return 0;
  return prisma.$transaction(async (tx) => {
    await lockUser(tx, inputs[0].userId);
    let created = 0;
    for (const input of inputs) {
      if (input.refId && (await tx.creditGrant.findUnique({ where: { refId: input.refId }, select: { id: true } }))) continue;
      await createGrant(tx, input);
      created++;
    }
    return created;
  });
}

export async function deductCredits(userId: string, amount: number, refId: string, note: string, actorId: string, now = new Date()) {
  return prisma.$transaction(async (tx) => {
    await lockUser(tx, userId);
    const grants = await spendableGrants(tx, userId, ["TEMPLATE_ONLY", "ANY"], now);
    const have = grants.reduce((s, g) => s + g.remaining, 0);
    if (have < amount) return { ok: false as const, have };
    const allocations = await allocate(tx, grants, amount);
    await tx.creditTxn.create({ data: { userId, kind: "ADJUST", delta: -amount, allocations, refId, note, actorId } });
    return { ok: true as const };
  });
}

export async function getBalanceAt(userId: string, now: Date): Promise<BalanceView> {
  const grants = await prisma.creditGrant.findMany({
    where: { userId, validFrom: { lte: now }, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
    select: { unit: true, source: true, scope: true, amount: true, remaining: true, expiresAt: true },
  });
  const credits = grants.filter((g) => g.unit === "CREDIT");
  const videos = grants.filter((g) => g.unit === "VIDEO");
  const monthly = credits.filter((g) => g.source === "MONTHLY");
  const sum = (list: typeof grants, key: "amount" | "remaining") => list.reduce((s, g) => s + g[key], 0);
  const total = sum(credits, "remaining");
  const templateOnly = sum(credits.filter((g) => g.scope === "TEMPLATE_ONLY"), "remaining");
  const monthlyRemaining = sum(monthly, "remaining");
  const expiries = monthly.map((g) => g.expiresAt).filter((d): d is Date => d !== null);
  return {
    total,
    monthly: monthly.length ? { remaining: monthlyRemaining, amount: sum(monthly, "amount"), expiresAt: expiries.length ? new Date(Math.min(...expiries.map(Number))) : null } : null,
    templateOnly,
    lasting: total - templateOnly - monthlyRemaining,
    videos: videos.length ? { remaining: sum(videos, "remaining"), amount: sum(videos, "amount") } : null,
  };
}

export const getBalance = cache((userId: string) => getBalanceAt(userId, new Date()));

export async function getAiBalance(userId: string, now = new Date()) {
  const r = await prisma.creditGrant.aggregate({
    where: { ...activeWhere(userId, "CREDIT", now), scope: "ANY" },
    _sum: { remaining: true },
  });
  return r._sum.remaining ?? 0;
}

export async function listTxns(userId: string, page = 1): Promise<{ items: TxnView[]; pageCount: number }> {
  const [items, total] = await Promise.all([
    prisma.creditTxn.findMany({
      where: { userId, createdAt: { lte: new Date() } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * TXN_PAGE_SIZE,
      take: TXN_PAGE_SIZE,
      select: { id: true, kind: true, charge: true, source: true, delta: true, note: true, createdAt: true },
    }),
    prisma.creditTxn.count({ where: { userId, createdAt: { lte: new Date() } } }),
  ]);
  return { items, pageCount: Math.max(1, Math.ceil(total / TXN_PAGE_SIZE)) };
}
