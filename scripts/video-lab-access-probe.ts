import "./load-env";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { SESSION_COOKIE, signSession } from "../src/lib/auth/token";

const BASE = process.argv[2] ?? "http://localhost:3010";
if (!/^http:\/\/localhost:\d+$/.test(BASE) || !/@(localhost|127\.0\.0\.1)[:/]/.test(process.env.DATABASE_URL ?? "")) throw new Error("Video lab access probe only allows localhost.");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  const [admin, user] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { phone: "13800000000" }, select: { id: true, role: true } }),
    prisma.user.findUniqueOrThrow({ where: { phone: "13900000000" }, select: { id: true, role: true } }),
  ]);
  const adminCookie = `${SESSION_COOKIE}=${await signSession({ userId: admin.id, role: "ADMIN" })}`;
  const userCookie = `${SESSION_COOKIE}=${await signSession({ userId: user.id, role: "USER" })}`;
  const page = await fetch(`${BASE}/admin/video-lab`, { headers: { cookie: adminCookie } });
  const pageText = await page.text();
  check("管理员可打开内部测试台", page.status === 200 && pageText.includes("多商品视频识别测试台"));
  const unauthorized = await fetch(`${BASE}/api/admin/video-recognition`, { method: "POST", headers: { origin: BASE } });
  check("未登录的识别请求被拒绝", unauthorized.status === 401);
  const forbidden = await fetch(`${BASE}/api/admin/video-recognition`, { method: "POST", headers: { origin: BASE, cookie: userCookie } });
  check("普通账号不能调用识别接口", forbidden.status === 403);
  console.log("Video lab access probe complete.");
}

let failures = 0;
function check(label: string, pass: boolean) {
  console.log(`${pass ? "PASS" : "FAIL"} ${label}`);
  if (!pass) failures++;
}

main().finally(async () => { await prisma.$disconnect(); if (failures) process.exitCode = 1; });
