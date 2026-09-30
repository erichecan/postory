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
const actionId = (name: string) => {
  const hit = Object.entries(manifest.node).find(([, v]) => v.exportedName === name);
  if (!hit) throw new Error(`action ${name} not in manifest`);
  return hit[0];
};

async function call(name: string, args: unknown[], cookie = "") {
  const res = await fetch(`${BASE}/admin/accounts`, {
    method: "POST",
    redirect: "manual",
    headers: { "Next-Action": actionId(name), "Content-Type": "text/plain;charset=UTF-8", Accept: "text/x-component", ...(cookie ? { cookie } : {}) },
    body: JSON.stringify(args),
  });
  const body = await res.text();
  return { status: res.status, location: res.headers.get("location") ?? "", body, ok: /"ok":true/.test(body), denied: /^\d+:E\{/m.test(body) || /"ok":false/.test(body) };
}

const DAY = 24 * 3600 * 1000;
const near = (a: Date | null | undefined, b: Date, tolMs = 5 * 60 * 1000) => !!a && Math.abs(a.getTime() - b.getTime()) < tolMs;
const addMonths = (d: Date, n: number) => {
  const r = new Date(d);
  r.setUTCMonth(r.getUTCMonth() + n);
  return r;
};

async function main() {
  if (!/^http:\/\/localhost:/.test(BASE) || !/@(localhost|127\.0\.0\.1)[:/]/.test(process.env.DATABASE_URL ?? "")) throw new Error("只允许本地运行");
  const hash = await bcrypt.hash("probe-pass-123", 4);
  const stamp = Date.now();
  const admin = await prisma.user.create({ data: { email: `admin-probe-${stamp}@example.com`, name: "后台探针管理员", role: "ADMIN", passwordHash: hash } });
  const user = await prisma.user.create({ data: { email: `user-probe-${stamp}@example.com`, name: "后台探针用户", passwordHash: hash } });
  const target = await prisma.user.create({ data: { email: `target-probe-${stamp}@example.com`, name: "后台探针客户", passwordHash: hash } });
  const tiers = await prisma.membershipTier.findMany({ orderBy: { sortOrder: "asc" } });
  const tier = tiers[0];
  const backup = tiers.map((t) => ({ id: t.id, nameEn: t.nameEn, recommended: t.recommended }));
  const ck = async (id: string, role: "USER" | "ADMIN") => `${SESSION_COOKIE}=${await signSession({ userId: id, role })}`;
  const cAdmin = await ck(admin.id, "ADMIN");
  const cUser = await ck(user.id, "USER");
  const forged = `${SESSION_COOKIE}=${await signSession({ userId: user.id, role: "ADMIN" })}`;
  const plan = { tierId: tier.id, currency: "EUR", baseFee: 9900, extraPlatforms: ["x", "youtube"], extraPlatformFee: 3000, allInclusiveFee: null, monthlyCredits: 60, monthlyVideos: 4, topupUnitPrice: 100 };

  try {
    console.log("## 页面");
    const page = async (p: string, c: string) => (await fetch(BASE + p, { redirect: "manual", headers: { cookie: c } })).status;
    check("管理员打开客户详情 200", (await page(`/admin/accounts/${target.id}`, cAdmin)) === 200);
    check("客户不存在 → 404", (await page("/admin/accounts/nope", cAdmin)) === 404);
    check("管理员打开会员等级 200", (await page("/admin/tiers", cAdmin)) === 200);
    check("普通用户打开客户详情 → 拒绝", (await page(`/admin/accounts/${target.id}`, cUser)) === 307);
    check("普通用户打开会员等级 → 拒绝", (await page("/admin/tiers", cUser)) === 307);

    console.log("## 写操作鉴权（无会话 / 伪造 / 普通用户 → 拒绝且数据库不变）");
    const writes: [string, unknown[]][] = [
      ["adminSavePlanAction", [target.id, plan]],
      ["adminActivateOfflineAction", [target.id, 3]],
      ["adminAdjustCreditsAction", [target.id, { amount: 999, reason: "hack" }]],
      ["adminCancelPlanAction", [target.id]],
      ["adminSaveTierAction", [tier.id, { nameZh: "x" }]],
    ];
    for (const [name, args] of writes) {
      const none = await call(name, args);
      check(`无会话 ${name} → 跳登录`, none.status === 307 && none.location.startsWith("/login"));
      check(`伪造 ${name} → 跳登录/拒绝`, (await call(name, args, `${SESSION_COOKIE}=forged`)).status === 307);
      check(`普通用户 ${name} → 拒绝`, (await call(name, args, cUser)).denied);
      check(`普通用户伪造 role=ADMIN ${name} → 拒绝`, (await call(name, args, forged)).denied);
    }
    check("被拒后客户没有方案、没有额度", !(await prisma.customerPlan.findUnique({ where: { userId: target.id } })) && (await prisma.creditGrant.count({ where: { userId: target.id } })) === 0);

    console.log("## 方案");
    check("负数价格被拒", !(await call("adminSavePlanAction", [target.id, { ...plan, baseFee: -1 }], cAdmin)).ok);
    check("不存在的平台被拒", !(await call("adminSavePlanAction", [target.id, { ...plan, extraPlatforms: ["myspace"] }], cAdmin)).ok);
    check("非法币种被拒", !(await call("adminSavePlanAction", [target.id, { ...plan, currency: "USD" }], cAdmin)).ok);
    check("没有方案时线下开通被拒", !(await call("adminActivateOfflineAction", [target.id, 3], cAdmin)).ok);
    check("保存方案成功", (await call("adminSavePlanAction", [target.id, plan], cAdmin)).ok);
    const saved = await prisma.customerPlan.findUniqueOrThrow({ where: { userId: target.id } });
    check("新方案状态为待付款", saved.status === "PENDING_PAYMENT" && saved.billing === "STRIPE" && saved.extraPlatforms.length === 2);

    console.log("## 线下开通");
    check("开通月数 0 / 25 被拒", !(await call("adminActivateOfflineAction", [target.id, 0], cAdmin)).ok && !(await call("adminActivateOfflineAction", [target.id, 25], cAdmin)).ok);
    const t0 = new Date();
    check("线下开通 3 个月成功", (await call("adminActivateOfflineAction", [target.id, 3], cAdmin)).ok);
    const credits = await prisma.creditGrant.findMany({ where: { userId: target.id, unit: "CREDIT" }, orderBy: { validFrom: "asc" } });
    const videos = await prisma.creditGrant.count({ where: { userId: target.id, unit: "VIDEO" } });
    const contiguous = credits.every((g, i) => i === 0 || g.validFrom.getTime() === credits[i - 1].expiresAt?.getTime());
    check("生成 3 个月度 credit + 3 个视频额度，按月首尾相接", credits.length === 3 && videos === 3 && contiguous && near(credits[0].validFrom, t0) && credits.every((g) => g.amount === 60));
    const active = await prisma.customerPlan.findUniqueOrThrow({ where: { userId: target.id } });
    check("方案变为线下生效，有效期 +3 个月", active.status === "ACTIVE" && active.billing === "OFFLINE" && near(active.currentPeriodEnd, addMonths(credits[0].validFrom, 3), 1000));
    const now = await prisma.creditGrant.aggregate({ where: { userId: target.id, unit: "CREDIT", validFrom: { lte: new Date() }, expiresAt: { gt: new Date() } }, _sum: { remaining: true } });
    check("当前只有第一个月的额度可用", now._sum.remaining === 60);
    check("续开 2 个月从原有效期末开始", (await call("adminActivateOfflineAction", [target.id, 2], cAdmin)).ok);
    const extended = await prisma.customerPlan.findUniqueOrThrow({ where: { userId: target.id } });
    const fourth = await prisma.creditGrant.findMany({ where: { userId: target.id, unit: "CREDIT" }, orderBy: { validFrom: "asc" } });
    check("续开后共 5 个月、有效期 +5 个月", fourth.length === 5 && fourth[3].validFrom.getTime() === active.currentPeriodEnd?.getTime() && near(extended.currentPeriodEnd, addMonths(credits[0].validFrom, 5), 1000));
    check("未来月份的发放不出现在客户流水里（已到期前）", fourth[1].validFrom.getTime() > Date.now() + DAY);

    console.log("## 调整 credit");
    check("原因为空被拒", !(await call("adminAdjustCreditsAction", [target.id, { amount: 5, reason: " " }], cAdmin)).ok);
    check("加 5 成功", (await call("adminAdjustCreditsAction", [target.id, { amount: 5, reason: "补偿" }], cAdmin)).ok);
    const adj = await prisma.creditTxn.findFirst({ where: { userId: target.id, source: "ADMIN" } });
    check("流水记录原因与操作人", adj?.note === "补偿" && adj.actorId === admin.id);
    check("扣减超过余额被拒", !(await call("adminAdjustCreditsAction", [target.id, { amount: -1000, reason: "x" }], cAdmin)).ok);
    check("扣 3 成功", (await call("adminAdjustCreditsAction", [target.id, { amount: -3, reason: "误发" }], cAdmin)).ok);

    console.log("## 取消方案");
    const futureBefore = await prisma.creditGrant.count({ where: { userId: target.id, source: "MONTHLY", validFrom: { gt: new Date() } } });
    check("取消成功", (await call("adminCancelPlanAction", [target.id], cAdmin)).ok && (await prisma.customerPlan.findUniqueOrThrow({ where: { userId: target.id } })).status === "CANCELED");
    const futureAfter = await prisma.creditGrant.count({ where: { userId: target.id, source: "MONTHLY", validFrom: { gt: new Date() } } });
    check("取消后，线下开通的未来月份额度一并作废", futureBefore > 0 && futureAfter === 0, `之前 ${futureBefore} 笔，之后 ${futureAfter} 笔`);

    console.log("## 会员等级");
    const base = { nameZh: tier.nameZh, nameEn: "Basic Probe", taglineZh: tier.taglineZh, taglineEn: tier.taglineEn, benefitsZh: tier.benefitsZh, benefitsEn: tier.benefitsEn, features: tier.features, defaultMonthlyCredits: 60, defaultMonthlyVideos: 4, referenceFee: 9900, recommended: true, visible: true, sortOrder: tier.sortOrder };
    const features = tier.features as Record<string, unknown>;
    check("权益矩阵多出未知项被拒", !(await call("adminSaveTierAction", [tier.id, { ...base, features: { ...features, hack: true } }], cAdmin)).ok);
    const missing = { ...features };
    delete missing.templates;
    check("权益矩阵缺项被拒", !(await call("adminSaveTierAction", [tier.id, { ...base, features: missing }], cAdmin)).ok);
    check("保存等级成功", (await call("adminSaveTierAction", [tier.id, base], cAdmin)).ok);
    const recs = await prisma.membershipTier.findMany({ where: { recommended: true } });
    check("推荐只能有一个", recs.length === 1 && recs[0].id === tier.id);
    const plans = await fetch(`${BASE}/plans`, { headers: { cookie: "NEXT_LOCALE=en" } }).then((r) => r.text());
    check("/plans 立即显示新名称", plans.includes("Basic Probe"));

    console.log("## 线下建账号（邮箱）");
    const body = new FormData();
    body.set("_1_email", `offline-probe-${stamp}@example.com`);
    body.set("_1_name", "线下探针");
    body.set("_1_password", "probe-pass-123");
    body.set("0", JSON.stringify(["$undefined", "$K1"]));
    await fetch(`${BASE}/admin/accounts`, { method: "POST", headers: { "Next-Action": actionId("adminCreateUserAction"), Accept: "text/x-component", cookie: cAdmin }, body });
    const offline = await prisma.user.findUnique({ where: { email: `offline-probe-${stamp}@example.com` } });
    check("管理员用邮箱建账号，来源线下、邮箱视为已验证、无注册赠送", offline?.source === "OFFLINE" && offline.emailVerifiedAt !== null && (await prisma.creditGrant.count({ where: { userId: offline.id } })) === 0);
  } finally {
    for (const b of backup) await prisma.membershipTier.update({ where: { id: b.id }, data: { nameEn: b.nameEn, recommended: b.recommended } as Prisma.MembershipTierUpdateInput });
    await prisma.user.deleteMany({ where: { email: { contains: `-probe-${stamp}@` } } });
    await prisma.$disconnect();
  }
  if (failures) process.exit(1);
}

main();
