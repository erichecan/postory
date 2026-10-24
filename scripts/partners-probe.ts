import "./load-env";
import { readFileSync } from "node:fs";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { SESSION_COOKIE, signSession } from "../src/lib/auth/token";
import { createTrialRequest } from "../src/lib/db/partner-trials";
import { grantAgencyAccess } from "../src/lib/db/agency-access";

const BASE = process.argv[2] ?? "http://localhost:3010";
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
}

async function get(path: string, cookie?: string) {
  return fetch(BASE + path, { redirect: "manual", headers: cookie ? { cookie } : {} });
}

const manifest = JSON.parse(readFileSync(".next/server/server-reference-manifest.json", "utf8")) as { node: Record<string, { exportedName: string }> };
const actionId = (name: string) => {
  const hit = Object.entries(manifest.node).find(([, v]) => v.exportedName === name);
  if (!hit) throw new Error(`action ${name} not in manifest`);
  return hit[0];
};

// 回放浏览器无 JS 时 useActionState(action) 原生表单回退提交的协议，复现真实用户提交 /partners/trial 表单。
async function submitTrialForm(fields: Record<string, string>) {
  const body = new FormData();
  for (const [k, v] of Object.entries(fields)) body.set(`_1_${k}`, v);
  body.set("0", JSON.stringify(["$undefined", "$K1"]));
  const res = await fetch(`${BASE}/partners/trial`, {
    method: "POST",
    redirect: "manual",
    headers: { "Next-Action": actionId("submitPartnerTrialAction"), Accept: "text/x-component" },
    body,
  });
  return { status: res.status, location: res.headers.get("location") ?? res.headers.get("x-action-redirect")?.split(";")[0] ?? "", text: await res.text() };
}

async function main() {
  if (!/^http:\/\/localhost:/.test(BASE) || !/@(localhost|127\.0\.0\.1)[:/]/.test(process.env.DATABASE_URL ?? "")) {
    throw new Error("探针会创建临时账号与试做申请，只允许对本地服务与本地数据库运行");
  }
  const stamp = Date.now();
  const passwordHash = await bcrypt.hash("probe-pass-123", 4);
  const agencyA = await prisma.user.create({ data: { email: `partners-probe-a-${stamp}@example.com`, name: "探针代理商A", passwordHash, role: "USER" } });
  const agencyB = await prisma.user.create({ data: { email: `partners-probe-b-${stamp}@example.com`, name: "探针代理商B", passwordHash, role: "USER" } });
  const clientOfB = await prisma.user.create({ data: { email: `partners-probe-client-${stamp}@example.com`, name: "探针客户", passwordHash, role: "USER" } });
  const plainUser = await prisma.user.create({ data: { email: `partners-probe-plain-${stamp}@example.com`, name: "探针普通用户", passwordHash, role: "USER" } });
  await grantAgencyAccess(agencyB.id, clientOfB.id);

  const ck = async (id: string) => `${SESSION_COOKIE}=${await signSession({ userId: id, role: "USER" })}`;
  const cookieA = await ck(agencyA.id);
  const cookiePlain = await ck(plainUser.id);

  const trial = await createTrialRequest({
    agencyUserId: null,
    agencyName: "探针代理商试做",
    agencyContact: `probe-contact-${stamp}`,
    clientBrandName: `探针客户品牌-${stamp}`,
    industry: "BEAUTY_HAIR",
    country: "IE",
    marketArea: "Dublin",
    productOrService: "美甲工作室",
    targetAudience: null,
    highlightNotes: null,
    platforms: [],
    websiteUrl: null,
    socialHandles: null,
    languagePreference: "zh",
  });

  console.log("## 路由探针");
  check("GET /partners 公开 200", (await get("/partners")).status === 200);
  check("GET /partners/demo 引导演示公开 200", (await get("/partners/demo")).status === 200);
  check("GET /partners/trial 公开 200", (await get("/partners/trial")).status === 200);
  check("GET /partners/trial/[存在的token] → 200", (await get(`/partners/trial/${trial.request.viewToken}`)).status === 200);
  check("GET /partners/trial/[随机token] → 404", (await get("/partners/trial/does-not-exist-token")).status === 404);

  console.log("## 越权探针");
  const unauth = await get("/partners/clients");
  check("未登录访问 /partners/clients → 跳登录（3xx）", unauth.status >= 300 && unauth.status < 400, `status=${unauth.status}`);
  const aOnB = await get(`/partners/clients/${clientOfB.id}`, cookieA);
  check("代理商 A 访问代理商 B 名下客户 → 403", aOnB.status === 403, `status=${aOnB.status}`);
  const plainOnClient = await get(`/partners/clients/${clientOfB.id}`, cookiePlain);
  check("没有任何 AgencyAccess 的普通用户访问任意客户 → 403", plainOnClient.status === 403, `status=${plainOnClient.status}`);

  console.log("## 试做判重探针");
  const before = await prisma.partnerTrialRequest.count();
  const dup = await createTrialRequest({
    agencyUserId: null,
    agencyName: "探针代理商试做（第二次提交）",
    agencyContact: `probe-contact-${stamp}`,
    clientBrandName: `探针客户品牌-${stamp}`,
    industry: "BEAUTY_HAIR",
    country: "IE",
    marketArea: "Dublin",
    productOrService: "美甲工作室（改过的文案）",
    targetAudience: null,
    highlightNotes: null,
    platforms: [],
    websiteUrl: null,
    socialHandles: null,
    languagePreference: "zh",
  });
  const after = await prisma.partnerTrialRequest.count();
  check("同一 clientBrandName+agencyContact 重复提交 → 标记重复，不新建记录", dup.duplicate === true && dup.request.id === trial.request.id && after === before, `before=${before} after=${after} duplicate=${dup.duplicate}`);

  console.log("## 试做判重不泄露他人 viewToken 探针（安全修复回归）");
  const replay = await submitTrialForm({
    agencyName: "攻击者",
    agencyContact: `probe-contact-${stamp}`,
    clientBrandName: `探针客户品牌-${stamp}`,
    industry: "BEAUTY_HAIR",
    country: "IE",
    marketArea: "Dublin",
    productOrService: "无关内容",
    targetAudience: "",
    highlightNotes: "",
    websiteUrl: "",
    socialHandles: "",
    languagePreference: "zh",
  });
  const leaksToken = replay.location.includes(trial.request.viewToken) || replay.text.includes(trial.request.viewToken);
  check("已知 clientBrandName+agencyContact 重复提交 → 不跳转/不回传原申请的 viewToken", !leaksToken, `status=${replay.status} location=${replay.location}`);

  await prisma.agencyAccess.deleteMany({ where: { agencyUserId: { in: [agencyA.id, agencyB.id] } } });
  await prisma.partnerTrialRequest.deleteMany({ where: { id: trial.request.id } });
  await prisma.user.deleteMany({ where: { id: { in: [agencyA.id, agencyB.id, clientOfB.id, plainUser.id] } } });
  await prisma.$disconnect();
  console.log(failures ? `\n${failures} 项失败` : "\n全部通过");
  process.exit(failures ? 1 : 0);
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
