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

type Manifest = { node: Record<string, { filename: string; exportedName: string }> };
const manifest = JSON.parse(readFileSync(".next/server/server-reference-manifest.json", "utf8")) as Manifest;
function actionId(name: string) {
  const hit = Object.entries(manifest.node).find(([, v]) => v.exportedName === name);
  if (!hit) throw new Error(`action ${name} not in manifest`);
  return hit[0];
}

async function get(path: string, cookie?: string) {
  return fetch(BASE + path, { redirect: "manual", headers: cookie ? { cookie } : {} });
}

async function callAction(name: string, args: unknown[], cookie?: string) {
  const res = await fetch(`${BASE}/templates`, {
    method: "POST",
    redirect: "manual",
    headers: {
      "Next-Action": actionId(name),
      "Content-Type": "text/plain;charset=UTF-8",
      Accept: "text/x-component",
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify(args),
  });
  return { status: res.status, location: res.headers.get("location") ?? "", body: await res.text() };
}

type ActionResult = Awaited<ReturnType<typeof callAction>>;
const sentToLogin = (r: ActionResult) => r.status === 307 && r.location.startsWith("/login");
const denied = (r: ActionResult) => r.status === 200 && (/^\d+:E\{/m.test(r.body) || /"ok":false/.test(r.body));
const rejected = (r: ActionResult) => sentToLogin(r) || denied(r) || r.status >= 400;

async function ensureUser(phone: string, name: string, role: "USER" | "ADMIN") {
  const passwordHash = await bcrypt.hash("probe-pass-123", 4);
  return prisma.user.upsert({ where: { phone }, create: { phone, name, role, passwordHash }, update: { disabled: false, role } });
}

async function main() {
  const a = await ensureUser("19900000001", "探针用户A", "USER");
  const b = await ensureUser("19900000002", "探针用户B", "USER");
  const admin = await ensureUser("19900000009", "探针管理员", "ADMIN");
  const tpl = await prisma.template.findFirstOrThrow({ where: { editable: true }, orderBy: { sortOrder: "asc" } });
  const design = await prisma.design.create({
    data: { userId: a.id, templateId: tpl.id, title: "probe-original", pages: tpl.pages as Prisma.InputJsonValue },
  });

  const ck = async (id: string, role: "USER" | "ADMIN") => `${SESSION_COOKIE}=${await signSession({ userId: id, role })}`;
  const cookieA = await ck(a.id, "USER");
  const cookieB = await ck(b.id, "USER");
  const cookieAdmin = await ck(admin.id, "ADMIN");
  const forged = `${SESSION_COOKIE}=eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJ4Iiwicm9sZSI6IkFETUlOIn0.forged`;
  const adminForged = `${SESSION_COOKIE}=${await signSession({ userId: a.id, role: "ADMIN" })}`;

  console.log("## 路由探针");
  const userRoutes = ["/templates", "/templates?platform=youtube&page=2", `/templates/${tpl.id}`, "/designs", "/profile", "/onboarding", `/editor/${design.id}`];
  for (const p of userRoutes) {
    const r = await get(p, cookieA);
    check(`GET ${p} 登录用户`, r.status === 200, `status=${r.status}`);
  }
  for (const p of ["/login", "/register"]) {
    const r = await get(p);
    check(`GET ${p} 公开`, r.status === 200, `status=${r.status}`);
  }
  check("GET /admin/accounts 管理员", (await get("/admin/accounts", cookieAdmin)).status === 200);
  check("GET /templates/不存在 → 404", (await get("/templates/nope", cookieA)).status === 404);

  console.log("## 鉴权探针（页面）");
  for (const p of ["/templates", "/designs", "/admin/accounts", `/editor/${design.id}`]) {
    const none = await get(p);
    check(`无 token ${p} → 跳登录`, none.status === 307 && (none.headers.get("location") ?? "").includes("/login"), `status=${none.status}`);
    const bad = await get(p, forged);
    check(`伪造 token ${p} → 跳登录`, bad.status === 307 && (bad.headers.get("location") ?? "").includes("/login"), `status=${bad.status}`);
  }
  const low = await get("/admin/accounts", cookieA);
  check("普通用户 /admin/accounts → 拒绝", low.status === 307 && !(low.headers.get("location") ?? "").includes("/admin"), `status=${low.status}`);
  const lowForgedRole = await get("/admin/accounts", adminForged);
  check("普通用户伪造 role=ADMIN → 拒绝（以数据库角色为准）", lowForgedRole.status === 307, `status=${lowForgedRole.status}`);
  check("用户 B 打开用户 A 的作品 → 404", (await get(`/editor/${design.id}`, cookieB)).status === 404);

  console.log("## 鉴权探针（写操作 Server Actions）");
  const payload = { title: "HACKED", pages: tpl.pages };
  const writes: [string, unknown[]][] = [
    ["saveDesignAction", [design.id, payload]],
    ["scheduleDesignAction", [design.id, { platforms: ["小红书"], scheduledAt: new Date().toISOString() }]],
    ["deleteDesignAction", [design.id]],
    ["adminToggleUserAction", [b.id, true]],
    ["adminCreateUserAction", [undefined, "$K"]],
    ["saveProfileAction", [undefined, "$K"]],
  ];
  for (const [name, args] of writes) {
    check(`无 token ${name} → 跳登录（≈401）`, sentToLogin(await callAction(name, args)));
    check(`伪造 token ${name} → 跳登录（≈401）`, sentToLogin(await callAction(name, args, forged)));
  }
  check("用户 B 保存用户 A 的作品 → 拒绝（≈403）", denied(await callAction("saveDesignAction", [design.id, payload], cookieB)));
  check("用户 B 删除用户 A 的作品 → 拒绝（≈403）", denied(await callAction("deleteDesignAction", [design.id], cookieB)));
  check("普通用户停用他人账号 → 拒绝（≈403）", denied(await callAction("adminToggleUserAction", [b.id, true], cookieA)));
  const usersBefore = await prisma.user.count();
  const created = await callAction("adminCreateUserAction", [undefined, "$K"], cookieA);
  check("普通用户开通账号后用户总数不变", (await prisma.user.count()) === usersBefore);
  check("普通用户开通账号 → 拒绝（≈403）", denied(created));
  check("伪造 role=ADMIN 停用他人 → 拒绝（≈403）", denied(await callAction("adminToggleUserAction", [b.id, true], adminForged)));

  const after = await prisma.design.findUnique({ where: { id: design.id } });
  check("以上攻击后 A 的作品未被修改/删除", after?.title === "probe-original" && after.status === "DRAFT", `title=${after?.title}`);
  const bAfter = await prisma.user.findUniqueOrThrow({ where: { id: b.id } });
  check("以上攻击后 B 账号未被停用", bAfter.disabled === false);

  const own = await callAction("saveDesignAction", [design.id, { title: "probe-own-save", pages: tpl.pages }], cookieA);
  check("用户 A 保存自己的作品 → 成功", /"ok":true/.test(own.body), `status=${own.status}`);

  const bigImage = "data:image/png;base64," + "A".repeat(3 * 1024 * 1024);
  const bigPages = structuredClone(tpl.pages) as { elements: { type: string; content?: string }[] }[];
  bigPages[0].elements.push({ type: "image", content: bigImage, ...{ id: "big", x: 0, y: 0, w: 1, h: 1, z: 1, rotation: 0, style: {} } });
  check("资源约束：超 2MB 图片的作品保存 → 拒绝", denied(await callAction("saveDesignAction", [design.id, { title: "big", pages: bigPages }], cookieA)));

  await prisma.design.delete({ where: { id: design.id } });
  await prisma.$disconnect();
  console.log(failures ? `\n${failures} 项失败` : "\n全部通过");
  process.exit(failures ? 1 : 0);
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
