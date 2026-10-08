import "./load-env";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { Client } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { studioSchema, nailsReturnPath } from "../src/lib/nails/validation";

// storage.ts and db/media-assets.ts import "server-only", which throws when required outside
// a Next.js server build. The key/path scheme is reproduced here instead of importing them.
const nailsMediaKey = (studioId: string, assetId: string) => `nails/${studioId}/${assetId}.png`;
const nailsLocalPath = (key: string) => path.join(process.cwd(), ".data", "uploads", key);

const base = process.argv[2] ?? "http://localhost:3002";
const dev = process.env.NAILS_DEV === "1";
const manifestPath = dev ? ".next/dev/server/server-reference-manifest.json" : ".next/server/server-reference-manifest.json";
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const prefix = `nails-probe-${Date.now()}`;
const emails = [`${prefix}-a@example.com`, `${prefix}-b@example.com`, `${prefix}-password@example.com`];
let checks = 0;

function check(name: string, condition: unknown) {
  assert.ok(condition, name);
  checks++;
  console.log(`PASS ${name}`);
}

async function page(path: string, cookie = "") {
  const response = await fetch(base + path, { redirect: "manual", headers: { cookie: `NEXT_LOCALE=en; ${cookie}` } });
  const body = await response.text();
  // A streaming App Router redirect can be delivered as a refresh meta tag.
  const location = response.headers.get("location") ?? /http-equiv="refresh" content="\d+;url=([^"]+)"/.exec(body)?.[1] ?? "";
  return { status: response.status, location, body };
}

async function action(path: string, name: string, fields: Record<string, string> | null, cookie = "") {
  await page(path, cookie); // Compile the dev route before loading its action manifest.
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as { node: Record<string, { exportedName: string }> };
  const id = Object.entries(manifest.node).find(([, value]) => value.exportedName === name)?.[0];
  assert.ok(id, `Missing action ${name}`);
  const body = new FormData();
  if (fields) {
    for (const [key, value] of Object.entries(fields)) body.set(`_1_${key}`, value);
    body.set("0", JSON.stringify(["$undefined", "$K1"]));
  }
  const response = await fetch(base + path, {
    method: "POST", redirect: "manual",
    headers: { "Next-Action": id, Accept: "text/x-component", Origin: base, cookie: `NEXT_LOCALE=en; ${cookie}`, ...(!fields ? { "Content-Type": "text/plain;charset=UTF-8" } : {}) },
    body: fields ? body : "[]",
  });
  return {
    status: response.status,
    location: response.headers.get("x-action-redirect")?.split(";")[0] ?? response.headers.get("location") ?? "",
    body: await response.text(),
    cookie: response.headers.getSetCookie().find((value) => value.startsWith("ss_session="))?.split(";")[0] ?? "",
    cookieHeader: response.headers.getSetCookie().find((value) => value.startsWith("ss_session=")) ?? "",
  };
}

async function code(email: string, secret = "654321", expired = false, purpose = "login") {
  await prisma.emailToken.deleteMany({ where: { email, purpose } });
  await prisma.emailToken.create({ data: {
    email, purpose,
    codeHash: createHmac("sha256", process.env.AUTH_SECRET!).update(`${purpose}:${email}:${secret}`).digest("hex"),
    expiresAt: new Date(Date.now() + (expired ? -1000 : 900_000)),
  } });
}

async function login(email: string, next = "/nails") {
  await code(email);
  const result = await action("/nails/login", "verifyNailsCodeAction", { email, code: "654321", next });
  check("Email code creates a persistent session", result.cookie && result.location === nailsReturnPath(next));
  check("Session cookie is HttpOnly, SameSite=Lax, seven days", /HttpOnly/i.test(result.cookieHeader) && /SameSite=lax/i.test(result.cookieHeader) && /Max-Age=604800/i.test(result.cookieHeader));
  return result.cookie;
}

async function checkRls(ownerA: string, studioB: string) {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query("BEGIN");
    // Transactional role and grants disappear on ROLLBACK. Local development only.
    const role = `nails_probe_${process.pid}`;
    await client.query(`CREATE ROLE ${role} NOLOGIN NOSUPERUSER NOBYPASSRLS`);
    await client.query(`GRANT USAGE ON SCHEMA public TO ${role}`);
    await client.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON "Studio" TO ${role}`);
    await client.query(`SET LOCAL ROLE ${role}`);
    check("RLS denies reads without tenant context", (await client.query('SELECT id FROM "Studio"')).rowCount === 0);
    await client.query("SELECT set_config('app.studio_owner_id', $1, true)", [ownerA]);
    const rows = await client.query('SELECT "ownerId" FROM "Studio"');
    check("RLS reads expose only the current owner", rows.rowCount === 1 && rows.rows[0].ownerId === ownerA);
    check("RLS rejects cross-owner updates", (await client.query('UPDATE "Studio" SET name = $1 WHERE id = $2', ["Forbidden", studioB])).rowCount === 0);
    await client.query("SAVEPOINT ownership_change");
    try {
      await client.query('UPDATE "Studio" SET "ownerId" = $1', ["forged-owner"]);
      assert.fail("RLS allowed changing the owner");
    } catch (error) {
      check("RLS WITH CHECK blocks ownership changes", (error as { code?: string }).code === "42501");
      await client.query("ROLLBACK TO SAVEPOINT ownership_change");
    }
  } finally {
    await client.query("ROLLBACK");
    await client.end();
  }
}

async function checkMediaRls(ownerA: string, ownerB: string, assetId: string) {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query("BEGIN");
    // Transactional role and grants disappear on ROLLBACK. Local development only.
    const role = `nails_probe_media_${process.pid}`;
    await client.query(`CREATE ROLE ${role} NOLOGIN NOSUPERUSER NOBYPASSRLS`);
    await client.query(`GRANT USAGE ON SCHEMA public TO ${role}`);
    await client.query(`GRANT SELECT, DELETE ON "MediaAsset" TO ${role}`);
    // The policy's USING clause subquery against Studio needs its own grant to evaluate.
    await client.query(`GRANT SELECT ON "Studio" TO ${role}`);
    await client.query(`SET LOCAL ROLE ${role}`);
    check("MediaAsset RLS denies reads without tenant context", (await client.query('SELECT id FROM "MediaAsset" WHERE id = $1', [assetId])).rowCount === 0);
    await client.query("SELECT set_config('app.studio_owner_id', $1, true)", [ownerB]);
    check("MediaAsset RLS hides another owner's asset", (await client.query('SELECT id FROM "MediaAsset" WHERE id = $1', [assetId])).rowCount === 0);
    check("MediaAsset RLS blocks deleting another owner's asset", (await client.query('DELETE FROM "MediaAsset" WHERE id = $1', [assetId])).rowCount === 0);
    await client.query("SELECT set_config('app.studio_owner_id', $1, true)", [ownerA]);
    check("MediaAsset RLS exposes the owner's own asset", (await client.query('SELECT id FROM "MediaAsset" WHERE id = $1', [assetId])).rowCount === 1);
  } finally {
    await client.query("ROLLBACK");
    await client.end();
  }
}

async function createTestMediaAsset(studioId: string, assetId: string, bytes: Buffer) {
  const key = nailsMediaKey(studioId, assetId);
  await mkdir(path.dirname(nailsLocalPath(key)), { recursive: true });
  await writeFile(nailsLocalPath(key), bytes);
  await prisma.mediaAsset.create({ data: { id: assetId, studioId, key, mimeType: "image/png", byteSize: bytes.length, width: 1, height: 1 } });
  return key;
}

async function deleteTestMediaAsset(studioId: string, assetId: string) {
  await prisma.mediaAsset.deleteMany({ where: { id: assetId, studioId } });
  await rm(nailsLocalPath(nailsMediaKey(studioId, assetId)), { force: true });
}

async function main() {
  assert.match(base, /^http:\/\/localhost:\d+$/);
  assert.ok(["localhost", "127.0.0.1"].includes(new URL(process.env.DATABASE_URL!).hostname), "Local database only");
  assert.ok(!process.env.RESEND_API_KEY, "Do not send probe messages through a real mail provider");
  try {
    check("Studio validation rejects empty names and invalid zones", !studioSchema.safeParse({ name: " ", timeZone: "wrong" }).success);
    check("Return paths reject external URLs and auth loops", ["//evil.test", "/\\evil.test", "https://evil.test", "/nails/login", "/nails/demo"].every((value) => nailsReturnPath(value) === "/nails"));
    check("Anonymous demo renders", (await page("/nails/demo")).status === 200);
    for (const path of ["/nails", "/nails/create", "/nails/appointments", "/nails/me", "/nails/onboarding"]) {
      const response = await page(path);
      check(`Anonymous ${path} redirects with a return path`, response.status === 307 && response.location.includes("/nails/login?next="));
    }

    const send = await action("/nails/login", "requestNailsCodeAction", { email: emails[0].toUpperCase() });
    if (send.status >= 400) console.error(send.status, send.body.slice(-3000));
    check(dev ? "Code request normalizes email and succeeds in development" : "Production refuses sign-in mail without provider", dev ? send.body.includes('"ok":true') : send.body.includes('"error"'));
    if (dev) {
      const resend = await action("/nails/login", "requestNailsCodeAction", { email: emails[0] });
      check("Resend cooldown is enforced on server", resend.body.includes('"error"') && await prisma.emailToken.count({ where: { email: emails[0], purpose: "login" } }) === 1);
      await prisma.emailToken.deleteMany({ where: { email: emails[0] } });
      const parallel = await Promise.all(Array.from({ length: 4 }, () => action("/nails/login", "requestNailsCodeAction", { email: emails[0] })));
      check("Parallel sends cannot bypass the cooldown", parallel.filter((result) => result.body.includes('"ok":true')).length === 1);
    }
    await code(emails[0], "654321", true);
    const expired = await action("/nails/login", "verifyNailsCodeAction", { email: emails[0], code: "654321" });
    check("Expired codes do not log in", !expired.cookie && expired.body.includes('"error"'));
    await code(emails[0]);
    for (let index = 0; index < 5; index++) await action("/nails/login", "verifyNailsCodeAction", { email: emails[0], code: "000000" });
    const exhausted = await action("/nails/login", "verifyNailsCodeAction", { email: emails[0], code: "654321" });
    check("Code is blocked after five incorrect attempts", !exhausted.cookie && exhausted.body.includes('"error"'));

    const cookieA = await login(emails[0], "//evil.test");
    const a = await prisma.user.findUniqueOrThrow({ where: { email: emails[0] } });
    check("First login creates a verified shared PoStory user", a.emailVerifiedAt !== null);
    check("No plaintext login secret stored as password", a.passwordHash.startsWith("$2"));
    check("First login requires onboarding", (await page("/nails", cookieA)).location.includes("/nails/onboarding"));
    const replay = await action("/nails/login", "verifyNailsCodeAction", { email: emails[0], code: "654321" });
    check("Login code cannot be replayed", !replay.cookie);
    const invalid = await action("/nails/onboarding", "createStudioAction", { name: "", timeZone: "not-a-zone" }, cookieA);
    check("Invalid studio never reaches the database", invalid.body.includes('"error"') && await prisma.studio.count({ where: { ownerId: a.id } }) === 0);
    const results = await Promise.all(Array.from({ length: 3 }, () => action("/nails/onboarding", "createStudioAction", { name: "Studio Alpha", timeZone: "America/Toronto", ownerId: "forged", id: "forged" }, cookieA)));
    check("Concurrent onboarding creates exactly one studio", results.every((r) => r.location === "/nails/create") && await prisma.studio.count({ where: { ownerId: a.id } }) === 1);
    for (const path of ["/nails/create", "/nails/appointments", "/nails/me"]) check(`Authenticated ${path} renders`, (await page(path, cookieA)).status === 200);
    check("Refresh preserves workspace and session", (await page("/nails/me", cookieA)).body.includes("Studio Alpha"));
    check("Existing workspace skips onboarding", (await page("/nails/onboarding", cookieA)).location.includes("/nails/create"));

    const cookieB = await login(emails[1]);
    await action("/nails/onboarding", "createStudioAction", { name: "Studio Beta", timeZone: "Asia/Shanghai" }, cookieB);
    const b = await prisma.user.findUniqueOrThrow({ where: { email: emails[1] }, include: { studio: true } });
    const meB = await page(`/nails/me?ownerId=${a.id}`, cookieB);
    check("Forged owner in URL cannot expose another workspace", meB.body.includes("Studio Beta") && !meB.body.includes("Studio Alpha") && !meB.body.includes(emails[0]));
    await action("/nails/me", "updateStudioAction", { name: "Studio Alpha Updated", timeZone: "Europe/Dublin", ownerId: b.id, id: b.studio!.id }, cookieA);
    check("Forged owner in action cannot update another workspace", (await prisma.studio.findUniqueOrThrow({ where: { ownerId: b.id } })).name === "Studio Beta");
    check("Own changes persist", (await page("/nails/me", cookieA)).body.includes("Studio Alpha Updated"));
    await checkRls(a.id, b.studio!.id);

    const studioA = await prisma.studio.findUniqueOrThrow({ where: { ownerId: a.id } });
    const png1x1 = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");
    const assetId = "probeasset0000000000000001";
    const assetKey = await createTestMediaAsset(studioA.id, assetId, png1x1);
    try {
      await checkMediaRls(a.id, b.id, assetId);

      const anonMedia = await fetch(`${base}/api/nails-media/${assetKey}`);
      check("Anonymous media request is unauthorized", anonMedia.status === 401);
      const otherOwnerMedia = await fetch(`${base}/api/nails-media/${assetKey}`, { headers: { cookie: cookieB } });
      check("A different studio's owner cannot fetch another studio's media", otherOwnerMedia.status === 404);
      const ownMedia = await fetch(`${base}/api/nails-media/${assetKey}`, { headers: { cookie: cookieA } });
      const ownBytes = Buffer.from(await ownMedia.arrayBuffer());
      check("Owner can fetch their own media with correct bytes and content type", ownMedia.status === 200 && ownMedia.headers.get("content-type") === "image/png" && ownBytes.equals(png1x1));
      const missingKey = nailsMediaKey(studioA.id, "missingasset0000000000001");
      const missingMedia = await fetch(`${base}/api/nails-media/${missingKey}`, { headers: { cookie: cookieA } });
      check("A well-formed but nonexistent media key is 404, not 500", missingMedia.status === 404);
    } finally {
      await deleteTestMediaAsset(studioA.id, assetId);
    }
    const afterDelete = await fetch(`${base}/api/nails-media/${assetKey}`, { headers: { cookie: cookieA } });
    check("Deleted media is no longer servable", afterDelete.status === 404);

    const anonymousWrite = await action("/nails/me", "updateStudioAction", { name: "Anonymous", timeZone: "UTC" });
    check("Anonymous mutations are blocked", anonymousWrite.location.includes("/nails/login"));
    const logout = await action("/nails/me", "nailsLogoutAction", null, cookieA);
    check("Sign out clears the cookie and returns to login", logout.location === "/nails/login" && logout.cookie === "ss_session=");
    check("Signed-out browser cannot read workspace", (await page("/nails/me")).location.includes("/nails/login"));
    const again = await login(emails[0], "/nails/me");
    check("Returning user sees the same saved workspace", (await page("/nails/me", again)).body.includes("Studio Alpha Updated") && await prisma.studio.count({ where: { ownerId: a.id } }) === 1);
    check("OTP login does not grant duplicate signup credits", await prisma.creditGrant.count({ where: { userId: a.id, source: "SIGNUP_GIFT" } }) === 1);
    await prisma.user.update({ where: { id: a.id }, data: { disabled: true } });
    check("Disabled accounts lose access even with a signed cookie", (await page("/nails/me", again)).location.includes("/nails/login"));
    await code(emails[0]);
    check("Disabled accounts cannot use OTP", !(await action("/nails/login", "verifyNailsCodeAction", { email: emails[0], code: "654321" })).cookie);

    const password = "Probe-password-123";
    const registered = await action("/register", "registerAction", { email: emails[2], name: "Password Studio", password, next: "/nails/me" });
    check("Password registration preserves safe destination", registered.cookie && registered.location.includes("next=%2Fnails%2Fme"));
    await code(emails[2], "654321", false, "verify");
    const verified = await action("/verify-email", "verifyEmailAction", { code: "654321", next: "/nails/me" }, registered.cookie);
    check("Shared email verification returns to Nails", verified.location === "/nails/me");
    const pwLogin = await action("/login", "loginAction", { identifier: emails[2], password, next: "/nails/me" });
    check("Existing password login is compatible with Nails", pwLogin.cookie && pwLogin.location === "/nails/me");
    const defaultLogin = await action("/login", "loginAction", { identifier: emails[2], password });
    check("Main platform default destination stays dashboard", defaultLogin.location === "/dashboard");
    check("Already signed in respects safe return path", (await page("/login?next=/nails/me", pwLogin.cookie)).location === "/nails/me");
    for (const path of ["/", "/login", "/register", "/forgot-password"]) check(`Main platform ${path} still renders`, (await page(path)).status === 200);
    console.log(`NAILS PROBE PASS (${checks} checks)`);
  } finally {
    await prisma.user.deleteMany({ where: { email: { in: emails } } });
    await prisma.emailToken.deleteMany({ where: { email: { in: emails } } });
    await prisma.$disconnect();
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
