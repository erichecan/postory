import "./load-env";
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const BASE = process.argv[2] ?? "http://localhost:3010";
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
}

type Manifest = { node: Record<string, { exportedName: string }> };
const manifest = JSON.parse(readFileSync(".next/server/server-reference-manifest.json", "utf8")) as Manifest;
function actionId(name: string) {
  const hit = Object.entries(manifest.node).find(([, v]) => v.exportedName === name);
  if (!hit) throw new Error(`action ${name} not in manifest`);
  return hit[0];
}

type Result = { status: number; location: string; body: string; cookie: string };

async function formAction(page: string, name: string, fields: Record<string, string>, cookie = ""): Promise<Result> {
  const body = new FormData();
  for (const [k, v] of Object.entries(fields)) body.set(`_1_${k}`, v);
  body.set("0", JSON.stringify(["$undefined", "$K1"]));
  return send(page, name, body, cookie);
}

async function argsAction(page: string, name: string, args: unknown[], cookie = ""): Promise<Result> {
  return send(page, name, JSON.stringify(args), cookie, "text/plain;charset=UTF-8");
}

async function send(page: string, name: string, body: FormData | string, cookie: string, type?: string): Promise<Result> {
  const res = await fetch(BASE + page, {
    method: "POST",
    redirect: "manual",
    headers: { "Next-Action": actionId(name), Accept: "text/x-component", ...(type ? { "Content-Type": type } : {}), ...(cookie ? { cookie } : {}) },
    body,
  });
  const set = res.headers.getSetCookie().map((c) => c.split(";")[0]).find((c) => c.startsWith("ss_session="));
  const location = res.headers.get("location") ?? res.headers.get("x-action-redirect")?.split(";")[0] ?? "";
  return { status: res.status, location, body: await res.text(), cookie: set ?? "" };
}

function hmac(purpose: string, email: string, secret: string) {
  return createHmac("sha256", process.env.AUTH_SECRET ?? "").update(`${purpose}:${email}:${secret}`).digest("hex");
}

async function plantToken(email: string, purpose: "verify" | "reset", secret: string, expiresAt = new Date(Date.now() + 600_000)) {
  await prisma.emailToken.updateMany({ where: { email, purpose, usedAt: null }, data: { usedAt: new Date() } });
  await prisma.emailToken.create({ data: { email, purpose, codeHash: hmac(purpose, email, secret), expiresAt, createdAt: new Date(Date.now() - 120_000) } });
}

async function pageStatus(path: string, cookie: string) {
  return (await fetch(BASE + path, { redirect: "manual", headers: { cookie } })).status;
}

async function main() {
  if (!/^http:\/\/localhost:/.test(BASE) || !/@(localhost|127\.0\.0\.1)[:/]/.test(process.env.DATABASE_URL ?? "")) throw new Error("只允许本地运行");
  const email = `probe-${Date.now()}@example.com`;
  const password = "probe-pass-123";
  try {
    console.log("## 邮箱注册");
    const reg = await formAction("/register", "registerAction", { email: email.toUpperCase(), name: "探针门店", password });
    check("注册 → 跳 /verify-email 并下发会话", reg.location.startsWith("/verify-email") && reg.cookie !== "", `status=${reg.status} location=${reg.location}`);
    const user = await prisma.user.findUnique({ where: { email } });
    check("邮箱统一存小写", user !== null);
    check("注册即发出验证码", (await prisma.emailToken.count({ where: { email, purpose: "verify" } })) === 1);
    const dup = await formAction("/register", "registerAction", { email, name: "x", password });
    check("重复邮箱注册被拒", dup.status === 200 && dup.body.includes("已注册") || dup.body.includes("already registered"));
    const bad = await formAction("/register", "registerAction", { email: "not-an-email", name: "x", password });
    check("非法邮箱被拒", bad.status === 200 && !(await prisma.user.findFirst({ where: { email: "not-an-email" } })));
    const session = reg.cookie;

    console.log("## 验证码");
    const resend = await argsAction("/verify-email", "resendVerifyCodeAction", [], session);
    check("60 秒内重发被限流", /"error"/.test(resend.body), resend.body.slice(0, 80));
    await plantToken(email, "verify", "123456");
    for (let i = 0; i < 4; i++) await formAction("/verify-email", "verifyEmailAction", { code: "000000" }, session);
    const fifth = await formAction("/verify-email", "verifyEmailAction", { code: "000000" }, session);
    const locked = await formAction("/verify-email", "verifyEmailAction", { code: "123456" }, session);
    check("错 5 次后验证码作废，正确码也不行", fifth.status === 200 && locked.status === 200 && !(await prisma.user.findUniqueOrThrow({ where: { email } })).emailVerifiedAt);
    await plantToken(email, "verify", "777777");
    await Promise.all(Array.from({ length: 20 }, (_, i) => formAction("/verify-email", "verifyEmailAction", { code: String(100000 + i) }, session)));
    const raced = await prisma.emailToken.findFirstOrThrow({ where: { email, purpose: "verify", usedAt: null } });
    const afterRace = await formAction("/verify-email", "verifyEmailAction", { code: "777777" }, session);
    check("并发 20 次猜码只计 5 次，之后正确码也作废", raced.attempts === 5 && afterRace.status === 200 && !(await prisma.user.findUniqueOrThrow({ where: { email } })).emailVerifiedAt, `attempts=${raced.attempts}`);
    await plantToken(email, "verify", "222222", new Date(Date.now() - 1000));
    const expired = await formAction("/verify-email", "verifyEmailAction", { code: "222222" }, session);
    check("过期验证码被拒", expired.status === 200 && !(await prisma.user.findUniqueOrThrow({ where: { email } })).emailVerifiedAt);
    await plantToken(email, "verify", "654321");
    const ok = await formAction("/verify-email", "verifyEmailAction", { code: "654321" }, session);
    const after = await prisma.user.findUniqueOrThrow({ where: { email }, include: { grants: true } });
    check("正确验证码 → 跳 /onboarding?gift=1", ok.location.startsWith("/onboarding?gift=1"), `status=${ok.status} location=${ok.location}`);
    check("验证后送 10 个仅模板额度", after.emailVerifiedAt !== null && after.grants.length === 1 && after.grants[0].amount === 10 && after.grants[0].scope === "TEMPLATE_ONLY");
    await formAction("/verify-email", "verifyEmailAction", { code: "654321" }, session);
    check("重复验证不会重复赠送", (await prisma.creditGrant.count({ where: { userId: after.id } })) === 1);
    check("无会话调验证 → 跳登录", (await formAction("/verify-email", "verifyEmailAction", { code: "654321" })).location.startsWith("/login"));

    console.log("## 登录");
    const wrong = await formAction("/login", "loginAction", { identifier: email, password: "wrong-password" });
    check("错误密码被拒", wrong.status === 200 && wrong.cookie === "");
    const login = await formAction("/login", "loginAction", { identifier: email.toUpperCase(), password });
    check("邮箱（大小写不敏感）+ 密码登录成功", login.cookie !== "" && login.location === "/dashboard", `location=${login.location}`);
    for (let i = 0; i < 10; i++) await formAction("/login", "loginAction", { identifier: email, password: "wrong-password" });
    const lockedLogin = await formAction("/login", "loginAction", { identifier: email, password });
    check("连错 10 次后锁定 15 分钟，正确密码也登不上", lockedLogin.cookie === "" && (await prisma.user.findUniqueOrThrow({ where: { email } })).loginLockedUntil !== null);
    await prisma.user.update({ where: { email }, data: { loginLockedUntil: null, loginFailures: 0 } });

    console.log("## 找回密码");
    const unknown = await formAction("/forgot-password", "requestResetAction", { email: "nobody-here@example.com" });
    const known = await formAction("/forgot-password", "requestResetAction", { email });
    const message = (s: string) => /"message":"([^"]+)"/.exec(s)?.[1] ?? "";
    check("已注册与未注册邮箱返回相同提示（不泄露是否注册）", message(unknown.body) !== "" && message(unknown.body) === message(known.body));
    check("已注册邮箱生成重设 token", (await prisma.emailToken.count({ where: { email, purpose: "reset" } })) === 1);
    check("未注册邮箱不生成 token", (await prisma.emailToken.count({ where: { email: "nobody-here@example.com" } })) === 0);
    const token = "t".repeat(43);
    await plantToken(email, "reset", token);
    const badReset = await formAction("/reset-password", "resetPasswordAction", { email, token: "x".repeat(43), password: "new-pass-456" });
    check("错误 token 重设被拒", badReset.status === 200 && !badReset.location);
    const good = await formAction("/reset-password", "resetPasswordAction", { email, token, password: "new-pass-456" });
    check("正确 token 重设 → 跳 /login?reset=1", good.location.startsWith("/login?reset=1"), `location=${good.location}`);
    check("重设后旧会话失效", (await pageStatus("/membership", login.cookie)) === 307);
    const reuse = await formAction("/reset-password", "resetPasswordAction", { email, token, password: "other-pass-789" });
    check("重设 token 只能用一次", reuse.status === 200 && !reuse.location);
    const oldPw = await formAction("/login", "loginAction", { identifier: email, password });
    const newPw = await formAction("/login", "loginAction", { identifier: email, password: "new-pass-456" });
    check("旧密码失效、新密码可登录", oldPw.cookie === "" && newPw.cookie !== "");

    console.log("## 老账号");
    const phoneUser = await prisma.user.findFirst({ where: { phone: "13800000000" } });
    if (phoneUser) {
      const phoneLogin = await formAction("/login", "loginAction", { identifier: "13800000000", password: "admin12345" });
      check("手机号老账号仍可登录", phoneLogin.cookie !== "");
    }
  } finally {
    await prisma.user.deleteMany({ where: { email } });
    await prisma.emailToken.deleteMany({ where: { email: { in: [email, "nobody-here@example.com"] } } });
    await prisma.$disconnect();
  }
  if (failures) process.exit(1);
}

main();
