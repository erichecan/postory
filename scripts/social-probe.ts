import "./load-env";
import { readFileSync } from "node:fs";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Prisma } from "../src/generated/prisma/client";
import { SESSION_COOKIE, signSession } from "../src/lib/auth/token";
import { decryptSecret, encryptSecret } from "../src/lib/crypto";
import { getAyrshareGateway } from "../src/lib/ayrshare";

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
  const res = await fetch(`${BASE}/profile`, {
    method: "POST",
    redirect: "manual",
    headers: { "Next-Action": actionId(name), "Content-Type": "text/plain;charset=UTF-8", Accept: "text/x-component", ...(cookie ? { cookie } : {}) },
    body: JSON.stringify(args),
  });
  return { status: res.status, body: await res.text() };
}

const TINY_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

async function main() {
  if (!/^http:\/\/localhost:/.test(BASE) || !/@(localhost|127\.0\.0\.1)[:/]/.test(process.env.DATABASE_URL ?? "")) throw new Error("只允许本地运行");

  console.log("## crypto.ts 加解密");
  const cipher = encryptSecret("PROFILE-KEY-abc123");
  check("加密后解密拿回原文", decryptSecret(cipher) === "PROFILE-KEY-abc123");
  const cipher2 = encryptSecret("PROFILE-KEY-abc123");
  check("同一明文每次加密结果不同（随机 iv）", cipher !== cipher2);
  const tampered = Buffer.from(cipher, "base64");
  tampered[tampered.length - 1] ^= 0xff;
  let threw = false;
  try {
    decryptSecret(tampered.toString("base64"));
  } catch {
    threw = true;
  }
  check("密文被篡改后解密抛错（GCM 认证失败）", threw);

  console.log("## Ayrshare fake gateway 结构性检查");
  const src = readFileSync("src/lib/ayrshare.ts", "utf8");
  const fakeBody = src.slice(src.indexOf("function fakeGateway"), src.indexOf("export function getAyrshareGateway"));
  check("fake 模式函数体内不含任何 fetch() 调用（结构上保证零出站请求）", !fakeBody.includes("fetch("));

  const gateway = getAyrshareGateway();
  check("本地/verify 环境默认走 fake 网关", gateway.mode === "fake");
  const mapped = await gateway.publish({ profileKey: "pk", caption: "c", mediaUrl: "https://x/y.png", platforms: ["x"] });
  check('平台名映射 "x" → "twitter"', mapped.perPlatform[0]?.platform === "twitter");
  check("fake publish 全平台成功", mapped.overallStatus === "SUCCESS");

  console.log("## 多租户连接 + 真实发布（fake 模式）流程");
  const stamp = Date.now();
  const hash = await bcrypt.hash("x", 4);
  const a = await prisma.user.create({ data: { email: `social-a-${stamp}@example.com`, name: "社交探针A", passwordHash: hash } });
  const b = await prisma.user.create({ data: { email: `social-b-${stamp}@example.com`, name: "社交探针B", passwordHash: hash } });
  const tier = await prisma.membershipTier.findFirstOrThrow({ orderBy: { sortOrder: "asc" } });
  const tpl = await prisma.template.findFirstOrThrow({ where: { editable: true } });
  await prisma.customerPlan.create({ data: { userId: a.id, tierId: tier.id, currency: "EUR", baseFee: 9900, extraPlatforms: ["x"], extraPlatformFee: 3000, monthlyCredits: 60, monthlyVideos: 4, status: "ACTIVE", billing: "OFFLINE" } });
  await prisma.creditGrant.create({ data: { userId: a.id, source: "TOPUP", amount: 5, remaining: 5 } });
  const design = await prisma.design.create({ data: { userId: a.id, templateId: tpl.id, title: "social-probe", pages: tpl.pages as Prisma.InputJsonValue }, select: { id: true } });
  const cA = `${SESSION_COOKIE}=${await signSession({ userId: a.id, role: "USER" })}`;
  const cB = `${SESSION_COOKIE}=${await signSession({ userId: b.id, role: "USER" })}`;

  try {
    const connect = await call("connectSocialAction", ["facebook"], cA);
    const url = /"url":"([^"]+)"/.exec(connect.body)?.[1]?.replace(/\\u0026/g, "&").replace(/\\\//g, "/");
    check("connectSocialAction 返回 url", /"ok":true/.test(connect.body) && !!url, connect.body.slice(0, 120));

    const userAfterProfile = await prisma.user.findUniqueOrThrow({ where: { id: a.id } });
    check("建 Profile 后 Profile-Key 已加密存储（不是明文）", !!userAfterProfile.ayrshareProfileKeyEnc && !userAfterProfile.ayrshareProfileKeyEnc.includes("pk_fake"));

    if (url) {
      const cbRes = await fetch(url, { headers: { cookie: cA }, redirect: "manual" });
      check("回调路由处理后重定向回 /profile", cbRes.status === 302 && (cbRes.headers.get("location") ?? "").includes("/profile"));
    }
    const acct = await prisma.socialAccount.findUnique({ where: { userId_platform: { userId: a.id, platform: "facebook" } } });
    check("fake 模式下回调后 facebook 已标记为已连接", !!acct?.connectedAt);

    const bAccounts = await prisma.socialAccount.findMany({ where: { userId: b.id } });
    check("多租户隔离：B 看不到 A 的连接", bAccounts.length === 0);

    const notConnected = await call("scheduleDesignAction", [design.id, { platforms: ["x"], scheduledAt: new Date(Date.now() + 86400000).toISOString(), caption: "c", exportedImageUrl: "https://x/y.png" }], cA);
    check("平台在方案里但没连接 → platformNotConnected", /"code":"platformNotConnected"/.test(notConnected.body));

    const upload = await fetch(`${BASE}/api/designs/${design.id}/publish-asset`, { method: "POST", headers: { "content-type": "application/json", cookie: cA }, body: JSON.stringify({ dataUrl: TINY_PNG }) });
    const uploadJson = (await upload.json()) as { ok: boolean; url?: string };
    check("导出图上传成功，返回公开 URL", uploadJson.ok && !!uploadJson.url?.includes("/api/public-media/pub/"));

    const publishOk = await call("scheduleDesignAction", [design.id, { platforms: ["facebook"], scheduledAt: new Date(Date.now() + 86400000).toISOString(), caption: "hello", exportedImageUrl: uploadJson.url }], cA);
    check("已连接平台 + 已上传导出图 → 发布成功", /"ok":true/.test(publishOk.body) && /"publishStatus":"SUCCESS"/.test(publishOk.body));
    const designAfter = await prisma.design.findUniqueOrThrow({ where: { id: design.id } });
    check("Design 写回 ayrsharePostId / publishStatus", designAfter.publishStatus === "SUCCESS" && !!designAfter.ayrsharePostId);

    const resubmit = await call("scheduleDesignAction", [design.id, { platforms: ["facebook"], scheduledAt: new Date(Date.now() + 172800000).toISOString(), caption: "改个文案", exportedImageUrl: uploadJson.url }], cA);
    const designAfterResubmit = await prisma.design.findUniqueOrThrow({ where: { id: design.id } });
    check(
      "同一作品改文案/时间重新提交 → 不重复真实发布（ayrsharePostId 不变，只是改了时间）",
      /"ok":true/.test(resubmit.body) && designAfterResubmit.ayrsharePostId === designAfter.ayrsharePostId && designAfterResubmit.scheduledAt?.getTime() !== designAfter.scheduledAt?.getTime(),
    );

    if (uploadJson.url) {
      const pub = await fetch(uploadJson.url);
      check("公开导出图任何人（无 cookie）都能读到", pub.status === 200);
    }
  } finally {
    await prisma.design.deleteMany({ where: { userId: { in: [a.id, b.id] } } });
    await prisma.user.deleteMany({ where: { id: { in: [a.id, b.id] } } });
    await prisma.$disconnect();
  }
  if (failures) process.exit(1);
}

main();
