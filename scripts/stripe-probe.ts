import "./load-env";
import { existsSync, readFileSync } from "node:fs";
import bcrypt from "bcryptjs";
import Stripe from "stripe";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { SESSION_COOKIE, signSession } from "../src/lib/auth/token";

const BASE = process.argv[2] ?? "http://localhost:3010";
const SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "";
const LOG = ".data/stripe-fake/log.jsonl";
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
}

const manifest = JSON.parse(readFileSync(".next/server/server-reference-manifest.json", "utf8")) as { node: Record<string, { exportedName: string }> };
const actionId = (name: string) => Object.entries(manifest.node).find(([, v]) => v.exportedName === name)?.[0] ?? "";

async function call(name: string, args: unknown[], cookie = "") {
  const res = await fetch(`${BASE}/membership`, {
    method: "POST",
    redirect: "manual",
    headers: { "Next-Action": actionId(name), "Content-Type": "text/plain;charset=UTF-8", Accept: "text/x-component", ...(cookie ? { cookie } : {}) },
    body: JSON.stringify(args),
  });
  return { status: res.status, location: res.headers.get("location") ?? res.headers.get("x-action-redirect")?.split(";")[0] ?? "", body: await res.text() };
}

type LogEntry = { op: string; userId?: string; customerId?: string; subscriptionId?: string; currency?: string; lines?: { key: string; unitAmount: number; quantity: number }[]; unitAmount?: number; quantity?: number };
const logEntries = (): LogEntry[] => (existsSync(LOG) ? readFileSync(LOG, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l) as LogEntry) : []);
const lastLog = (op: string, match: (e: LogEntry) => boolean) => logEntries().filter((e) => e.op === op && match(e)).at(-1);

let seq = 0;
async function send(type: string, object: Record<string, unknown>, opts: { id?: string; signature?: string | null } = {}) {
  const payload = JSON.stringify({ id: opts.id ?? `evt_probe_${Date.now()}_${seq++}`, object: "event", type, api_version: "2026-08-26.dahlia", created: Math.floor(Date.now() / 1000), data: { object } });
  const signature = opts.signature === undefined ? Stripe.webhooks.generateTestHeaderString({ payload, secret: SECRET }) : opts.signature;
  const res = await fetch(`${BASE}/api/stripe/webhook`, { method: "POST", headers: { "Content-Type": "application/json", ...(signature ? { "stripe-signature": signature } : {}) }, body: payload });
  return { status: res.status, body: await res.text() };
}

async function adminCall(name: string, args: unknown[], cookie: string, userId: string) {
  const res = await fetch(`${BASE}/admin/accounts/${userId}`, { method: "POST", redirect: "manual", headers: { "Next-Action": actionId(name), "Content-Type": "text/plain;charset=UTF-8", Accept: "text/x-component", cookie }, body: JSON.stringify(args) });
  return { status: res.status, body: await res.text() };
}

const invoice = (id: string, sub: string, customer: string, start: number, end: number, userId?: string) => ({
  id,
  object: "invoice",
  customer,
  period_start: start,
  period_end: end,
  parent: { type: "subscription_details", subscription_details: { subscription: sub, metadata: userId ? { userId } : {} } },
  lines: { object: "list", data: [{ id: `il_${id}`, period: { start, end } }] },
});

async function balance(userId: string, unit: "CREDIT" | "VIDEO" = "CREDIT") {
  const now = new Date();
  const r = await prisma.creditGrant.aggregate({ where: { userId, unit, validFrom: { lte: now }, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }, _sum: { remaining: true } });
  return r._sum.remaining ?? 0;
}

async function main() {
  if (!/^http:\/\/localhost:/.test(BASE) || !/@(localhost|127\.0\.0\.1)[:/]/.test(process.env.DATABASE_URL ?? "")) throw new Error("只允许本地运行");
  if (!SECRET) throw new Error("需要 STRIPE_WEBHOOK_SECRET");
  const stamp = Date.now();
  const hash = await bcrypt.hash("x", 4);
  const tier = await prisma.membershipTier.findFirstOrThrow({ orderBy: { sortOrder: "asc" } });
  const mk = (tag: string) => prisma.user.create({ data: { email: `st-${tag}-${stamp}@example.com`, name: `Stripe${tag}`, passwordHash: hash } });
  const [a, b, c, d] = await Promise.all(["a", "b", "c", "d"].map(mk));
  const ck = async (id: string) => `${SESSION_COOKIE}=${await signSession({ userId: id, role: "USER" })}`;
  const [cA, cB, cC, cD] = await Promise.all([a, b, c, d].map((u) => ck(u.id)));
  const admin = await prisma.user.upsert({ where: { phone: "19900000009" }, create: { phone: "19900000009", name: "探针管理员", role: "ADMIN", passwordHash: hash }, update: { role: "ADMIN", disabled: false } });
  const cAdmin = `${SESSION_COOKIE}=${await signSession({ userId: admin.id, role: "ADMIN" })}`;
  const demo = await prisma.user.findUnique({ where: { phone: "demo" } });
  const planBase = { tierId: tier.id, monthlyCredits: 60, monthlyVideos: 4, extraPlatformFee: 3000, baseFee: 9900 };

  try {
    console.log("## 鉴权与前置条件");
    const none = await call("startCheckoutAction", []);
    check("无会话去付款 → 跳登录", none.status === 307 && none.location.startsWith("/login"));
    check("没有方案 → 拒绝，不建 Stripe 客户", /"ok":false/.test((await call("startCheckoutAction", [], cA)).body) && !lastLog("customer", (e) => e.userId === a.id));
    if (demo) check("演示账号去付款 → 拒绝", /"ok":false/.test((await call("startCheckoutAction", [], await ck(demo.id))).body));
    check("没有方案充值 → 拒绝", /"ok":false/.test((await call("startTopupAction", [50], cA)).body));

    console.log("## Checkout 金额");
    await prisma.customerPlan.create({ data: { ...planBase, userId: a.id, currency: "EUR", extraPlatforms: ["x", "youtube"], status: "PENDING_PAYMENT" } });
    const pay = await call("startCheckoutAction", [], cA);
    const co = lastLog("checkout.subscription", (e) => e.userId === a.id);
    const total = co?.lines?.reduce((s, l) => s + l.unitAmount * l.quantity, 0);
    check("99 + 2 × 30 EUR → 两行、15900 分、EUR", co?.currency === "EUR" && co.lines?.length === 2 && co.lines[0].unitAmount === 9900 && co.lines[1].unitAmount === 3000 && co.lines[1].quantity === 2 && total === 15900, JSON.stringify(co?.lines));
    check("跳转到支付页", pay.location.includes("/membership/success"));
    const custA = (await prisma.user.findUniqueOrThrow({ where: { id: a.id } })).stripeCustomerId;
    await call("startCheckoutAction", [], cA);
    check("再次付款复用同一个 Stripe 客户", !!custA && (await prisma.user.findUniqueOrThrow({ where: { id: a.id } })).stripeCustomerId === custA && logEntries().filter((e) => e.op === "customer" && e.userId === a.id).length === 1);
    await prisma.customerPlan.create({ data: { ...planBase, userId: b.id, currency: "CAD", extraPlatforms: ["x"], allInclusiveFee: 20000, status: "PENDING_PAYMENT" } });
    await call("startCheckoutAction", [], cB);
    const coB = lastLog("checkout.subscription", (e) => e.userId === b.id);
    check("全包一口价 C$200 → 一行 20000 分、CAD", coB?.currency === "CAD" && coB.lines?.length === 1 && coB.lines[0].unitAmount === 20000 && coB.lines[0].quantity === 1);

    console.log("## Webhook 验签");
    const txBefore = await prisma.creditTxn.count({ where: { userId: a.id } });
    const noSig = await send("invoice.paid", invoice("in_nosig", "sub_x", custA!, 1, 2), { signature: null });
    const badSig = await send("invoice.paid", invoice("in_badsig", "sub_x", custA!, 1, 2), { signature: "t=1,v1=deadbeef" });
    check("无签名 → 400", noSig.status === 400);
    check("错签名 → 400，数据库不变", badSig.status === 400 && (await prisma.creditTxn.count({ where: { userId: a.id } })) === txBefore);

    console.log("## 订阅开通与月度额度");
    const now = Math.floor(Date.now() / 1000);
    const end = now + 30 * 86400;
    const sessionEvt = await send("checkout.session.completed", { id: "cs_probe_a", object: "checkout.session", mode: "subscription", customer: custA, subscription: `sub_probe_a_${stamp}`, client_reference_id: a.id, metadata: { userId: a.id, kind: "subscription" }, payment_status: "paid" });
    const planA = await prisma.customerPlan.findUniqueOrThrow({ where: { userId: a.id } });
    check("checkout.session.completed → 生效、记下订阅号", sessionEvt.status === 200 && planA.status === "ACTIVE" && planA.stripeSubscriptionId === `sub_probe_a_${stamp}`);
    const inv = invoice(`in_probe_a_${stamp}`, `sub_probe_a_${stamp}`, custA!, now - 60, end);
    const evtId = `evt_probe_inv_${stamp}`;
    await send("invoice.paid", inv, { id: evtId });
    await send("invoice.paid", inv, { id: evtId });
    await send("invoice.paid", inv);
    const grants = await prisma.creditGrant.findMany({ where: { userId: a.id, source: "MONTHLY" } });
    check("invoice.paid 投递 3 次（2 次同事件 + 1 次新事件同发票）→ 只发 1 次 60 credit + 4 视频", (await balance(a.id)) === 60 && (await balance(a.id, "VIDEO")) === 4 && grants.length === 2);
    const planA2 = await prisma.customerPlan.findUniqueOrThrow({ where: { userId: a.id } });
    check("月度额度在本期结束时过期，续费日 = 本期结束", grants.every((g) => g.expiresAt?.getTime() === end * 1000) && planA2.currentPeriodEnd?.getTime() === end * 1000);

    console.log("## 重复订阅 / 与线下开通冲突");
    await send("checkout.session.completed", { id: "cs_dup_a", object: "checkout.session", mode: "subscription", customer: custA, subscription: `sub_dup_a_${stamp}`, metadata: { userId: a.id }, payment_status: "paid" });
    await send("invoice.paid", invoice(`in_dup_a_${stamp}`, `sub_dup_a_${stamp}`, custA!, now - 60, end, a.id));
    const planDup = await prisma.customerPlan.findUniqueOrThrow({ where: { userId: a.id } });
    check("同一客户第二个订阅付款成功 → 不替换原订阅、不重复发额度，并自动取消多出来的订阅", planDup.stripeSubscriptionId === `sub_probe_a_${stamp}` && (await balance(a.id)) === 60 && !!lastLog("subscription.cancel", (e) => e.subscriptionId === `sub_dup_a_${stamp}`));
    const offline = await adminCall("adminActivateOfflineAction", [a.id, 3], cAdmin, a.id);
    check("Stripe 自动续费中 → 线下开通被拒，不重复发额度", /"ok":false/.test(offline.body) && (await prisma.customerPlan.findUniqueOrThrow({ where: { userId: a.id } })).billing === "STRIPE" && (await balance(a.id)) === 60);

    console.log("## 乱序：invoice.paid 先于 checkout 完成");
    const custB = (await prisma.user.findUniqueOrThrow({ where: { id: b.id } })).stripeCustomerId!;
    await send("invoice.paid", invoice(`in_probe_b_${stamp}`, `sub_probe_b_${stamp}`, custB, now - 60, end, b.id));
    const planB = await prisma.customerPlan.findUniqueOrThrow({ where: { userId: b.id } });
    check("按客户号找到方案 → 生效并发额度", planB.status === "ACTIVE" && planB.stripeSubscriptionId === `sub_probe_b_${stamp}` && (await balance(b.id)) === 60);
    await send("checkout.session.completed", { id: "cs_probe_b", object: "checkout.session", mode: "subscription", customer: custB, subscription: `sub_probe_b_${stamp}`, metadata: { userId: b.id }, payment_status: "paid" });
    check("之后到的 checkout.session.completed 不重复发额度", (await balance(b.id)) === 60);

    console.log("## 扣款失败 / 状态变化 / 取消");
    await send("invoice.payment_failed", invoice(`in_fail_${stamp}`, `sub_probe_a_${stamp}`, custA!, now, end));
    check("invoice.payment_failed → 扣款失败", (await prisma.customerPlan.findUniqueOrThrow({ where: { userId: a.id } })).status === "PAST_DUE");
    await send("customer.subscription.updated", { id: `sub_probe_a_${stamp}`, object: "subscription", status: "active", items: { object: "list", data: [{ id: "si_1", current_period_end: end + 86400 }] } });
    const planA3 = await prisma.customerPlan.findUniqueOrThrow({ where: { userId: a.id } });
    check("subscription.updated active → 恢复生效，续费日更新", planA3.status === "ACTIVE" && planA3.currentPeriodEnd?.getTime() === (end + 86400) * 1000);
    await send("customer.subscription.deleted", { id: `sub_probe_b_${stamp}`, object: "subscription", status: "canceled", items: { object: "list", data: [] } });
    check("subscription.deleted → 已取消", (await prisma.customerPlan.findUniqueOrThrow({ where: { userId: b.id } })).status === "CANCELED");
    await send("invoice.paid", invoice(`in_late_b_${stamp}`, `sub_probe_b_${stamp}`, custB, now, end + 86400, b.id));
    await send("customer.subscription.updated", { id: `sub_probe_b_${stamp}`, object: "subscription", status: "active", items: { object: "list", data: [{ id: "si_b", current_period_end: end + 86400 }] } });
    check("已取消后迟到的 invoice.paid / subscription.updated 不会让方案复活、不发额度", (await prisma.customerPlan.findUniqueOrThrow({ where: { userId: b.id } })).status === "CANCELED" && (await balance(b.id)) === 60);
    check("取消后可以重新付款", /\/membership\/success/.test((await call("startCheckoutAction", [], cB)).location));
    check("生效中的方案不能重复付款", /"ok":false/.test((await call("startCheckoutAction", [], cA)).body));

    console.log("## 充值");
    check("充值少于 10 → 拒绝", /"ok":false/.test((await call("startTopupAction", [9], cA)).body));
    await prisma.customerPlan.update({ where: { userId: a.id }, data: { topupUnitPrice: 120 } });
    await call("startTopupAction", [50], cA);
    const tp = lastLog("checkout.topup", (e) => e.userId === a.id);
    check("充值 50 × €1.20 → 单价 120 分、数量 50、EUR", tp?.unitAmount === 120 && tp.quantity === 50 && tp.currency === "EUR");
    const topupSession = { id: `cs_topup_${stamp}`, object: "checkout.session", mode: "payment", customer: custA, payment_intent: `pi_probe_${stamp}`, payment_status: "paid", metadata: { userId: a.id, kind: "topup", credits: "50" } };
    await send("checkout.session.completed", topupSession);
    await send("checkout.session.completed", topupSession);
    const topupGrant = await prisma.creditGrant.findFirst({ where: { userId: a.id, source: "TOPUP" } });
    check("充值到账 50，不过期；重复通知只到一次", (await balance(a.id)) === 110 && topupGrant?.amount === 50 && topupGrant.expiresAt === null && (await prisma.creditGrant.count({ where: { userId: a.id, source: "TOPUP" } })) === 1);
    await send("checkout.session.completed", { ...topupSession, id: `cs_unpaid_${stamp}`, payment_intent: `pi_unpaid_${stamp}`, payment_status: "unpaid" });
    check("未付款的充值会话不发额度", (await balance(a.id)) === 110);
    await send("charge.refunded", { id: `ch_${stamp}`, object: "charge", payment_intent: `pi_probe_${stamp}`, refunded: true });
    await send("charge.refunded", { id: `ch_${stamp}`, object: "charge", payment_intent: `pi_probe_${stamp}`, refunded: true });
    check("充值退款 → 收回这笔充值剩余，只收一次", (await balance(a.id)) === 60 && (await prisma.creditTxn.count({ where: { userId: a.id, kind: "EXPIRE" } })) === 1);

    console.log("## 账单管理");
    check("有 Stripe 客户 → 打开账单页", /portal=fake/.test((await call("openBillingPortalAction", [], cA)).location));
    check("没有 Stripe 客户 → 拒绝", /"ok":false/.test((await call("openBillingPortalAction", [], cC)).body));

    console.log("## 后台改价同步订阅");
    const newPlan = { tierId: tier.id, currency: "EUR", baseFee: 12900, extraPlatforms: ["x"], extraPlatformFee: 3000, allInclusiveFee: null, monthlyCredits: 80, monthlyVideos: 4, topupUnitPrice: 120 };
    const saved = await fetch(`${BASE}/admin/accounts/${a.id}`, { method: "POST", redirect: "manual", headers: { "Next-Action": actionId("adminSavePlanAction"), "Content-Type": "text/plain;charset=UTF-8", Accept: "text/x-component", cookie: cAdmin }, body: JSON.stringify([a.id, newPlan]) });
    const sync = lastLog("subscription.replaceItems", (e) => e.subscriptionId === `sub_probe_a_${stamp}`);
    check("生效中的 Stripe 方案改价 → 订阅项替换为 129 + 1 × 30", saved.status === 200 && sync?.lines?.length === 2 && sync.lines[0].unitAmount === 12900 && sync.lines[1].quantity === 1);
    const cadPlan = { ...newPlan, currency: "CAD" };
    const cad = await adminCall("adminSavePlanAction", [a.id, cadPlan], cAdmin, a.id);
    check("Stripe 付款中的方案改币种 → 拒绝，数据库不变", /"ok":false/.test(cad.body) && (await prisma.customerPlan.findUniqueOrThrow({ where: { userId: a.id } })).currency === "EUR");
    const freePlan = { ...newPlan, baseFee: 0, extraPlatforms: [], allInclusiveFee: null };
    const free = await adminCall("adminSavePlanAction", [a.id, freePlan], cAdmin, a.id);
    check("Stripe 付款中的方案改成 0 元 → 拒绝，数据库不变", /"ok":false/.test(free.body) && (await prisma.customerPlan.findUniqueOrThrow({ where: { userId: a.id } })).baseFee === 12900);
    check("普通用户调改价 → 拒绝", /"ok":false|E\{/.test((await call("adminSavePlanAction", [a.id, newPlan], cD)).body));
    await fetch(`${BASE}/admin/accounts/${a.id}`, { method: "POST", redirect: "manual", headers: { "Next-Action": actionId("adminCancelPlanAction"), "Content-Type": "text/plain;charset=UTF-8", Accept: "text/x-component", cookie: cAdmin }, body: JSON.stringify([a.id]) });
    check("后台取消方案 → 同时取消 Stripe 订阅", !!lastLog("subscription.cancel", (e) => e.subscriptionId === `sub_probe_a_${stamp}`));
  } finally {
    await prisma.user.deleteMany({ where: { id: { in: [a.id, b.id, c.id, d.id] } } });
    await prisma.stripeEvent.deleteMany({ where: { id: { startsWith: "evt_probe_" } } });
    await prisma.$disconnect();
  }
  if (failures) process.exit(1);
}

main();
