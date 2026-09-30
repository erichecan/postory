import "./load-env";
import { readFileSync, rmSync } from "node:fs";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
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
  const res = await fetch(`${BASE}/create`, {
    method: "POST",
    redirect: "manual",
    headers: { "Next-Action": actionId(name), "Content-Type": "text/plain;charset=UTF-8", Accept: "text/x-component", ...(cookie ? { cookie } : {}) },
    body: JSON.stringify(args),
  });
  return { status: res.status, location: res.headers.get("location") ?? res.headers.get("x-action-redirect")?.split(";")[0] ?? "", body: await res.text() };
}

async function runGen(id: string, cookie = "") {
  const res = await fetch(`${BASE}/api/generations/${id}/run`, { method: "POST", headers: cookie ? { cookie } : {} });
  return { status: res.status, body: await res.text() };
}

const genId = (body: string) => /"ok":true,"id":"([a-z0-9]+)"/.exec(body)?.[1] ?? "";
const code = (body: string) => /"code":"(\w+)"/.exec(body)?.[1] ?? "";

async function balance(userId: string) {
  const now = new Date();
  const r = await prisma.creditGrant.aggregate({ where: { userId, unit: "CREDIT", validFrom: { lte: now }, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }, _sum: { remaining: true } });
  return r._sum.remaining ?? 0;
}

const TINY_PNG = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
const text = (prompt: string, extra: Record<string, unknown> = {}) => ({ mode: "text", scene: null, prompt, ratio: "square", quality: "standard", useBrand: false, parentId: null, photo: null, ...extra });

async function main() {
  if (!/^http:\/\/localhost:/.test(BASE) || !/@(localhost|127\.0\.0\.1)[:/]/.test(process.env.DATABASE_URL ?? "")) throw new Error("只允许本地运行");
  const stamp = Date.now();
  const hash = await bcrypt.hash("x", 4);
  const mk = (tag: string) => prisma.user.create({ data: { email: `gen-${tag}-${stamp}@example.com`, name: `生图${tag}`, passwordHash: hash } });
  const [a, b, c, d, e] = await Promise.all(["a", "b", "c", "d", "e"].map(mk));
  const ck = async (id: string) => `${SESSION_COOKIE}=${await signSession({ userId: id, role: "USER" })}`;
  const [cA, cB, cC, cD, cE] = await Promise.all([a, b, c, d, e].map((u) => ck(u.id)));
  const demo = await prisma.user.findUnique({ where: { phone: "demo" } });

  try {
    console.log("## 鉴权");
    const none = await call("createGenerationAction", [text("x")]);
    check("无会话 createGeneration → 跳登录", none.status === 307 && none.location.startsWith("/login"));
    check("无会话 run → 401", (await runGen("abcdefghijklmnop")).status === 401);
    check("无会话 /api/media → 401", (await fetch(`${BASE}/api/media/gen/${a.id}/abcdefghijkl-out.svg`)).status === 401);
    if (demo) {
      const r = await call("createGenerationAction", [text("x")], await ck(demo.id));
      check("演示账号 → 拒绝", code(r.body) === "demo");
    }

    console.log("## 扣费范围");
    await prisma.creditGrant.create({ data: { userId: a.id, source: "SIGNUP_GIFT", scope: "TEMPLATE_ONLY", amount: 5, remaining: 5 } });
    const giftOnly = await call("createGenerationAction", [text("gift only")], cA);
    check("只有注册赠送（仅模板）→ credit 不够，不留生成记录", code(giftOnly.body) === "insufficient" && (await prisma.generation.count({ where: { userId: a.id } })) === 0 && (await balance(a.id)) === 5);

    console.log("## 成功生成");
    await prisma.creditGrant.create({ data: { userId: a.id, source: "TOPUP", amount: 10, remaining: 10 } });
    const ok1 = await call("createGenerationAction", [text("autumn latte")], cA);
    const id1 = genId(ok1.body);
    check("标准图 → 扣 1（不动仅模板额度）", !!id1 && (await balance(a.id)) === 14 && (await prisma.creditGrant.aggregate({ where: { userId: a.id, scope: "TEMPLATE_ONLY" }, _sum: { remaining: true } }))._sum.remaining === 5);
    const busy = await call("createGenerationAction", [text("second")], cA);
    check("上一张没跑完 → 忙，不扣费", code(busy.body) === "busy" && (await balance(a.id)) === 14);
    check("B 调 A 的 run → 404", (await runGen(id1, cB)).status === 404);
    const run1 = await runGen(id1, cA);
    const row1 = await prisma.generation.findUniqueOrThrow({ where: { id: id1 } });
    check("A 执行 → SUCCEEDED 且有结果图", run1.status === 200 && /"ok":true/.test(run1.body) && row1.status === "SUCCEEDED" && !!row1.outputUrl);
    check("重复执行 → 409", (await runGen(id1, cA)).status === 409);
    const mediaA = await fetch(BASE + row1.outputUrl!, { headers: { cookie: cA } });
    check("A 能取自己的图", mediaA.status === 200 && (mediaA.headers.get("content-type") ?? "").startsWith("image/"));
    check("B 取 A 的图 → 404", (await fetch(BASE + row1.outputUrl!, { headers: { cookie: cB } })).status === 404);
    check("路径穿越 → 404", (await fetch(`${BASE}/api/media/gen/${a.id}/..%2F..%2F.env.local`, { headers: { cookie: cA } })).status === 404);

    console.log("## 高清 + 多轮");
    const hd = await call("createGenerationAction", [text("brighter", { quality: "hd", parentId: id1 })], cA);
    const hdId = genId(hd.body);
    await runGen(hdId, cA);
    const hdRow = await prisma.generation.findUniqueOrThrow({ where: { id: hdId } });
    check("接着改（高清）→ 扣 2，以上一张为输入", (await balance(a.id)) === 12 && hdRow.parentId === id1 && hdRow.inputUrl === row1.outputUrl && hdRow.status === "SUCCEEDED");
    const foreignParent = await call("createGenerationAction", [text("steal", { parentId: id1 })], cB);
    check("B 以 A 的图为底 → 找不到，不扣费", code(foreignParent.body) === "parentNotFound");

    console.log("## 失败退款");
    for (const marker of ["[fail]", "[reject]"]) {
      const f = await call("createGenerationAction", [text(`${marker} x`)], cA);
      const fid = genId(f.body);
      const before = await balance(a.id);
      const res = await runGen(fid, cA);
      const txns = await prisma.creditTxn.findMany({ where: { userId: a.id, refId: `gen:${fid}` } });
      const reason = marker === "[fail]" ? "failed" : "rejected";
      check(`${marker} → FAILED、退回 1、DEBIT+REFUND 成对`, new RegExp(`"reason":"${reason}"`).test(res.body) && (await balance(a.id)) === before + 1 && txns.length === 2 && txns.reduce((s, t) => s + t.delta, 0) === 0);
    }

    console.log("## 超时回收");
    const st = await call("createGenerationAction", [text("stale")], cA);
    const stId = genId(st.body);
    await prisma.generation.update({ where: { id: stId }, data: { createdAt: new Date(Date.now() - 11 * 60_000) } });
    const beforeStale = await balance(a.id);
    await fetch(`${BASE}/generations`, { headers: { cookie: cA } });
    const stRow = await prisma.generation.findUniqueOrThrow({ where: { id: stId } });
    check("超过 10 分钟仍 PENDING → 打开生成历史时标记失败并退款", stRow.status === "FAILED" && (await balance(a.id)) === beforeStale + 1);
    check("超时的生成不能再执行", (await runGen(stId, cA)).status === 409);

    console.log("## 上传");
    const bad = await call("createGenerationAction", [text("", { mode: "photo", photo: "data:image/gif;base64,R0lGODlhAQABAAAAACw=" })], cA);
    check("GIF → 格式不支持", code(bad.body) === "badType");
    const fake = await call("createGenerationAction", [text("", { mode: "photo", photo: `data:image/png;base64,${Buffer.from("not a png at all").toString("base64")}` })], cA);
    check("伪装成 PNG 的文本 → 格式不支持", code(fake.body) === "badType");
    const bigBefore = await balance(a.id);
    const big = Buffer.alloc(10 * 1024 * 1024 + 1024);
    Buffer.from(TINY_PNG, "base64").copy(big);
    const huge = await call("createGenerationAction", [text("", { mode: "photo", photo: `data:image/png;base64,${big.toString("base64")}` })], cA);
    check("超过 10MB → 拒绝且不扣费", (code(huge.body) === "tooLarge" || huge.status >= 400) && (await balance(a.id)) === bigBefore, `status=${huge.status}`);
    const photo = await call("createGenerationAction", [text("", { mode: "photo", scene: "dishCloseup", photo: `data:image/png;base64,${TINY_PNG}` })], cA);
    const pid = genId(photo.body);
    const pRow = await prisma.generation.findUnique({ where: { id: pid } });
    check("合法 PNG → 原图入库，模式为实拍美化", !!pRow?.inputUrl && pRow.mode === "PHOTO_ENHANCE");
    await runGen(pid, cA);

    console.log("## 送到编辑器");
    const foreign = await call("sendToEditorAction", [id1], cB);
    check("B 送 A 的图 → 拒绝", /"ok":false/.test(foreign.body));
    const send = await call("sendToEditorAction", [id1], cA);
    const designId = /\/editor\/([a-z0-9]+)/.exec(send.location || send.body)?.[1] ?? "";
    const design = designId ? await prisma.design.findFirst({ where: { id: designId, userId: a.id } }) : null;
    check("A 送到编辑器 → 新作品，图片指向生成结果", !!design && JSON.stringify(design.pages).includes(row1.outputUrl!));

    console.log("## 限流 / 成本上限 / 并发");
    await prisma.creditGrant.createMany({ data: [c, d, e].map((u) => ({ userId: u.id, source: "TOPUP" as const, amount: 10, remaining: 10 })) });
    await prisma.generation.createMany({ data: Array.from({ length: 30 }, () => ({ userId: c.id, mode: "TEXT_TO_IMAGE" as const, quality: "standard", size: "square", userPrompt: "x", credits: 1, status: "FAILED" as const })) });
    const limited = await call("createGenerationAction", [text("31st")], cC);
    check("一小时 30 次后 → 限流，不扣费", code(limited.body) === "rateLimited" && (await balance(c.id)) === 10);
    await prisma.generation.create({ data: { userId: d.id, mode: "TEXT_TO_IMAGE", quality: "hd", size: "square", userPrompt: "x", credits: 2, status: "SUCCEEDED", costMicros: 1_000_000_000 } });
    const capped = await call("createGenerationAction", [text("over cap")], cD);
    check("全站当日成本超上限 → 拒绝，不扣费", code(capped.body) === "capReached" && (await balance(d.id)) === 10);
    await prisma.generation.deleteMany({ where: { userId: d.id } });
    const burst = await Promise.all(Array.from({ length: 6 }, () => call("createGenerationAction", [text("burst")], cE)));
    const okCount = burst.filter((r) => genId(r.body)).length;
    check("同一人并发 6 次 → 只有 1 次成功，只扣 1", okCount === 1 && (await balance(e.id)) === 9, `成功 ${okCount}`);
  } finally {
    await prisma.user.deleteMany({ where: { id: { in: [a.id, b.id, c.id, d.id, e.id] } } });
    for (const u of [a, b, c, d, e]) rmSync(`.data/uploads/gen/${u.id}`, { recursive: true, force: true });
    await prisma.$disconnect();
  }
  if (failures) process.exit(1);
}

main();
