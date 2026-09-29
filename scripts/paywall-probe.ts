import "./load-env";
import { readFileSync } from "node:fs";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Prisma } from "../src/generated/prisma/client";
import { SESSION_COOKIE, signSession } from "../src/lib/auth/token";

const BASE = process.argv[2] ?? "http://localhost:3010";
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
}

const manifest = JSON.parse(readFileSync(".next/server/server-reference-manifest.json", "utf8")) as { node: Record<string, { exportedName: string }> };
const actionId = (name: string) => Object.entries(manifest.node).find(([, v]) => v.exportedName === name)?.[0] ?? "";

async function call(name: string, args: unknown[], cookie = "") {
  const res = await fetch(`${BASE}/designs`, {
    method: "POST",
    redirect: "manual",
    headers: { "Next-Action": actionId(name), "Content-Type": "text/plain;charset=UTF-8", Accept: "text/x-component", ...(cookie ? { cookie } : {}) },
    body: JSON.stringify(args),
  });
  return { status: res.status, location: res.headers.get("location") ?? "", body: await res.text() };
}

async function balance(userId: string) {
  const now = new Date();
  const r = await prisma.creditGrant.aggregate({ where: { userId, unit: "CREDIT", validFrom: { lte: now }, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }, _sum: { remaining: true } });
  return r._sum.remaining ?? 0;
}

async function main() {
  if (!/^http:\/\/localhost:/.test(BASE) || !/@(localhost|127\.0\.0\.1)[:/]/.test(process.env.DATABASE_URL ?? "")) throw new Error("只允许本地运行");
  const stamp = Date.now();
  const hash = await bcrypt.hash("x", 4);
  const a = await prisma.user.create({ data: { email: `pw-a-${stamp}@example.com`, name: "付费墙A", passwordHash: hash } });
  const b = await prisma.user.create({ data: { email: `pw-b-${stamp}@example.com`, name: "付费墙B", passwordHash: hash } });
  const tpl = await prisma.template.findFirstOrThrow({ where: { editable: true } });
  const tier = await prisma.membershipTier.findFirstOrThrow({ orderBy: { sortOrder: "asc" } });
  const mk = (userId: string) => prisma.design.create({ data: { userId, templateId: tpl.id, title: "pw", pages: tpl.pages as Prisma.InputJsonValue }, select: { id: true } });
  const d1 = await mk(a.id);
  const d2 = await mk(a.id);
  const d3 = await mk(a.id);
  const cA = `${SESSION_COOKIE}=${await signSession({ userId: a.id, role: "USER" })}`;
  const cB = `${SESSION_COOKIE}=${await signSession({ userId: b.id, role: "USER" })}`;
  const future = new Date(Date.now() + 86400000).toISOString();

  try {
    console.log("## 导出扣费");
    const none = await call("chargeDesignAction", [d1.id]);
    check("无会话导出扣费 → 跳登录", none.status === 307 && none.location.startsWith("/login"));
    const zero = await call("chargeDesignAction", [d1.id], cA);
    check("余额 0 导出 → credit 不够", /"reason":"insufficient"/.test(zero.body) && /"need":1/.test(zero.body));
    await prisma.creditGrant.create({ data: { userId: a.id, source: "SIGNUP_GIFT", scope: "TEMPLATE_ONLY", amount: 2, remaining: 2 } });
    await prisma.creditGrant.create({ data: { userId: b.id, source: "TOPUP", amount: 5, remaining: 5 } });
    const other = await call("chargeDesignAction", [d1.id], cB);
    check("别人的作品导出 → 找不到且不扣 B 的钱", /"reason":"notFound"/.test(other.body) && (await balance(b.id)) === 5);
    const first = await call("chargeDesignAction", [d1.id], cA);
    const second = await call("chargeDesignAction", [d1.id], cA);
    const d1Row = await prisma.design.findUniqueOrThrow({ where: { id: d1.id } });
    check("首次导出扣 1（注册赠送可用于模板）", /"ok":true/.test(first.body) && /"duplicate":false/.test(first.body) && d1Row.chargedAt !== null);
    check("同一作品再次导出不再扣", /"duplicate":true/.test(second.body) && (await balance(a.id)) === 1);

    console.log("## 发布计划");
    const noPlan = await call("scheduleDesignAction", [d2.id, { platforms: ["facebook"], scheduledAt: future }], cA);
    check("没有会员 → 需要开通，且不扣费", /"code":"needPlan"/.test(noPlan.body) && (await balance(a.id)) === 1);
    await prisma.customerPlan.create({ data: { userId: a.id, tierId: tier.id, currency: "EUR", baseFee: 9900, extraPlatforms: ["x"], extraPlatformFee: 3000, monthlyCredits: 60, monthlyVideos: 4, status: "ACTIVE", billing: "OFFLINE" } });
    const locked = await call("scheduleDesignAction", [d2.id, { platforms: ["facebook", "youtube"], scheduledAt: future }], cA);
    check("方案外的平台（YouTube）→ 拒绝，且不扣费", /"code":"platformNotAllowed"/.test(locked.body) && (await balance(a.id)) === 1);
    const okSched = await call("scheduleDesignAction", [d2.id, { platforms: ["facebook", "xiaohongshu", "x"], scheduledAt: future }], cA);
    const d2Row = await prisma.design.findUniqueOrThrow({ where: { id: d2.id } });
    check("基础平台 + 加开平台（X）→ 成功并扣 1", /"ok":true/.test(okSched.body) && d2Row.status === "SCHEDULED" && (await balance(a.id)) === 0);
    const again = await call("scheduleDesignAction", [d2.id, { platforms: ["facebook"], scheduledAt: future }], cA);
    check("同一作品改发布时间不再扣", /"ok":true/.test(again.body) && (await balance(a.id)) === 0);
    const exported = await call("scheduleDesignAction", [d1.id, { platforms: ["instagram"], scheduledAt: future }], cA);
    check("已导出过的作品加入发布计划不再扣", /"ok":true/.test(exported.body) && (await balance(a.id)) === 0);
    const broke = await call("scheduleDesignAction", [d3.id, { platforms: ["instagram"], scheduledAt: future }], cA);
    const d3Row = await prisma.design.findUniqueOrThrow({ where: { id: d3.id } });
    check("余额不足 → credit 不够，作品保持草稿", /"code":"insufficient"/.test(broke.body) && d3Row.status === "DRAFT");
    await prisma.customerPlan.update({ where: { userId: a.id }, data: { status: "PAST_DUE" } });
    await prisma.creditGrant.create({ data: { userId: a.id, source: "TOPUP", amount: 1, remaining: 1 } });
    check("扣款失败（PAST_DUE）期间仍可发布", /"ok":true/.test((await call("scheduleDesignAction", [d3.id, { platforms: ["tiktok"], scheduledAt: future }], cA)).body));
    await prisma.customerPlan.update({ where: { userId: a.id }, data: { status: "CANCELED" } });
    check("方案取消后 → 需要开通", /"code":"needPlan"/.test((await call("scheduleDesignAction", [d3.id, { platforms: ["tiktok"], scheduledAt: future }], cA)).body));
  } finally {
    await prisma.user.deleteMany({ where: { id: { in: [a.id, b.id] } } });
    await prisma.$disconnect();
  }
  if (failures) process.exit(1);
}

main();
