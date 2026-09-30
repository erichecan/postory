import "./load-env";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/db/client";
import { chargeCredits, deductCredits, getAiBalance, getBalanceAt, grantCredits, grantMany, refundCharge } from "../src/lib/db/credits";
import { grantTopup, revokeTopup } from "../src/lib/db/stripe-billing";

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
}

const HOUR = 3600 * 1000;

async function freshUser(tag: string) {
  const phone = `1980000${String(Math.floor(Math.random() * 1e4)).padStart(4, "0")}`;
  return prisma.user.create({ data: { phone, name: `账本探针-${tag}`, passwordHash: await bcrypt.hash("x", 4) }, select: { id: true } });
}

async function negativeGrants(userId: string) {
  return prisma.creditGrant.count({ where: { userId, remaining: { lt: 0 } } });
}

async function main() {
  if (!/@(localhost|127\.0\.0\.1)[:/]/.test(process.env.DATABASE_URL ?? "")) throw new Error("账本探针只允许在本地数据库运行");
  const users: string[] = [];
  const mk = async (tag: string) => {
    const u = await freshUser(tag);
    users.push(u.id);
    return u.id;
  };

  try {
    const now = new Date();

    const a = await mk("并发");
    await grantCredits({ userId: a, source: "TOPUP", amount: 5 });
    const results = await Promise.all(Array.from({ length: 20 }, (_, i) => chargeCredits(a, "AI_STANDARD", `gen-${a}-${i}`)));
    const okCount = results.filter((r) => r.ok).length;
    const balA = await getBalanceAt(a, new Date());
    check("余额 5 时并发 20 次扣 1 → 恰好 5 次成功", okCount === 5, `成功 ${okCount}`);
    check("并发后余额为 0 且无负数 grant", balA.total === 0 && (await negativeGrants(a)) === 0, `余额 ${balA.total}`);

    const b = await mk("退款");
    await grantCredits({ userId: b, source: "TOPUP", amount: 3 });
    await chargeCredits(b, "AI_HD", "gen-b-1");
    const afterCharge = (await getBalanceAt(b, new Date())).total;
    const refunded = await refundCharge(b, "gen-b-1");
    const refundedAgain = await refundCharge(b, "gen-b-1");
    const afterRefund = (await getBalanceAt(b, new Date())).total;
    const pair = await prisma.creditTxn.findMany({ where: { userId: b, refId: "gen-b-1" }, select: { kind: true, delta: true } });
    check("高清扣 2 → 失败退回，余额恢复", afterCharge === 1 && refunded && afterRefund === 3, `${afterCharge} → ${afterRefund}`);
    check("流水 DEBIT -2 与 REFUND +2 成对", pair.length === 2 && pair.some((x) => x.kind === "DEBIT" && x.delta === -2) && pair.some((x) => x.kind === "REFUND" && x.delta === 2));
    check("同一笔重复退款被拒绝", refundedAgain === false);

    const c = await mk("作品");
    await grantCredits({ userId: c, source: "TOPUP", amount: 5 });
    const r1 = await chargeCredits(c, "TEMPLATE_EXPORT", "design-c");
    const r2 = await chargeCredits(c, "TEMPLATE_EXPORT", "design-c");
    const r3 = await chargeCredits(c, "TEMPLATE_EXPORT", "design-c");
    const balC = (await getBalanceAt(c, new Date())).total;
    check("同一作品导出 3 次只扣 1 次", r1.ok && r2.ok && r3.ok && balC === 4 && r2.ok && r2.duplicate, `余额 ${balC}`);

    const d = await mk("赠送");
    await grantCredits({ userId: d, source: "SIGNUP_GIFT", scope: "TEMPLATE_ONLY", amount: 3, refId: `gift-${d}` });
    const ai = await chargeCredits(d, "AI_STANDARD", "gen-d-1");
    check("赠送额度（仅模板）不能用于 AI 生图", !ai.ok && ai.reason === "insufficient" && ai.have === 0);
    await grantCredits({ userId: d, source: "TOPUP", amount: 2 });
    await chargeCredits(d, "TEMPLATE_EXPORT", "design-d");
    const balD = await getBalanceAt(d, new Date());
    check("模板扣费优先用赠送额度", balD.templateOnly === 2 && balD.lasting === 2, `赠送 ${balD.templateOnly} 充值 ${balD.lasting}`);
    const dup = await grantCredits({ userId: d, source: "SIGNUP_GIFT", scope: "TEMPLATE_ONLY", amount: 3, refId: `gift-${d}` });
    check("同一 refId 发放 2 次只发 1 次", dup.duplicate && (await prisma.creditGrant.count({ where: { refId: `gift-${d}` } })) === 1);

    const e = await mk("到期");
    await grantCredits({ userId: e, source: "MONTHLY", amount: 10, validFrom: new Date(now.getTime() - 48 * HOUR), expiresAt: new Date(now.getTime() - HOUR) });
    await grantCredits({ userId: e, source: "MONTHLY", amount: 10, validFrom: new Date(now.getTime() + 24 * HOUR), expiresAt: new Date(now.getTime() + 48 * HOUR) });
    const balE = await getBalanceAt(e, new Date());
    const chargeE = await chargeCredits(e, "AI_STANDARD", "gen-e-1");
    check("已过期与未生效的额度不计入余额、不可扣", balE.total === 0 && !chargeE.ok, `余额 ${balE.total}`);

    const f = await mk("先到期先用");
    await grantMany([
      { userId: f, source: "TOPUP", amount: 5 },
      { userId: f, source: "MONTHLY", amount: 5, expiresAt: new Date(now.getTime() + 24 * HOUR) },
    ]);
    await chargeCredits(f, "AI_HD", "gen-f-1");
    const balF = await getBalanceAt(f, new Date());
    check("先扣会到期的月度额度", balF.monthly?.remaining === 3 && balF.lasting === 5, `月度 ${balF.monthly?.remaining} 充值 ${balF.lasting}`);
    const drain = [];
    for (let i = 2; i <= 5; i++) drain.push(await chargeCredits(f, "AI_HD", `gen-f-${i}`));
    const last = await chargeCredits(f, "AI_HD", "gen-f-6");
    check("剩 0 时高清图 2 credit 被拒且余额不变", drain.every((r) => r.ok) && !last.ok && (await getBalanceAt(f, new Date())).total === 0);

    const g = await mk("人工扣减");
    await grantCredits({ userId: g, source: "ADMIN", amount: 2, note: "probe" });
    const over = await deductCredits(g, 3, `adj-${g}`, "probe", g);
    const ok = await deductCredits(g, 2, `adj2-${g}`, "probe", g);
    check("人工扣减超过余额被拒，足额时成功", !over.ok && ok.ok && (await getBalanceAt(g, new Date())).total === 0);

    const h = await mk("充值退款后生成失败");
    await grantTopup(h, `pi_ledger_${h}`, 10);
    const genCharge = await chargeCredits(h, "AI_STANDARD", `gen:ledger-${h}`);
    const revoked = await revokeTopup(`pi_ledger_${h}`);
    await refundCharge(h, `gen:ledger-${h}`);
    check("充值被退款收回后，AI 失败退款不会让这笔钱复活", genCharge.ok && revoked === 9 && (await getAiBalance(h)) === 0, `收回 ${revoked}，可用 ${await getAiBalance(h)}`);
  } finally {
    await prisma.user.deleteMany({ where: { id: { in: users } } });
    await prisma.$disconnect();
  }
  if (failures) process.exit(1);
}

main();
