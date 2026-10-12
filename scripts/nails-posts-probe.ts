import "./load-env";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { Client } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { signSession, SESSION_COOKIE } from "../src/lib/auth/token";
import { deleteObject } from "../src/lib/storage";

const base = process.argv[2] ?? "http://localhost:3011";
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const email = `nails-post-probe-${Date.now()}@example.com`;
let checks = 0;
function check(name: string, condition: unknown) { assert.ok(condition, name); checks++; console.log(`PASS ${name}`); }

async function checkPostRls(ownerId: string, otherOwnerId: string) {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query("BEGIN");
    const role = `nails_posts_rls_${process.pid}`;
    await client.query(`CREATE ROLE ${role} NOLOGIN NOSUPERUSER NOBYPASSRLS`);
    await client.query(`GRANT USAGE ON SCHEMA public TO ${role}`);
    await client.query('GRANT SELECT ON "Studio" TO ' + role);
    for (const table of ["NailsPost", "NailsPostMedia", "NailsPostAvailability", "NailsPostExport"]) await client.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON "${table}" TO ${role}`);
    await client.query(`SET LOCAL ROLE ${role}`);
    for (const table of ["NailsPost", "NailsPostMedia", "NailsPostAvailability", "NailsPostExport"]) {
      await client.query("SELECT set_config('app.studio_owner_id', '', true)");
      check(`${table} denies reads without studio context`, (await client.query(`SELECT * FROM "${table}"`)).rowCount === 0);
      await client.query("SELECT set_config('app.studio_owner_id', $1, true)", [ownerId]);
      const visible = (await client.query(`SELECT * FROM "${table}"`)).rowCount;
      await client.query("SELECT set_config('app.studio_owner_id', $1, true)", [otherOwnerId]);
      check(`${table} rows are hidden from another studio`, (await client.query(`SELECT * FROM "${table}"`)).rowCount === 0);
      check(`${table} owner can still read its rows`, visible !== null && visible > 0);
    }
  } finally { await client.query("ROLLBACK"); await client.end(); }
}

async function action(path: string, name: string, args: unknown[], cookie: string) {
  const manifest = JSON.parse(readFileSync(".next/server/server-reference-manifest.json", "utf8")) as { node: Record<string, { exportedName: string }> };
  const id = Object.entries(manifest.node).find(([, entry]) => entry.exportedName === name)?.[0];
  assert.ok(id, `Missing action ${name}`);
  const response = await fetch(base + path, { method: "POST", headers: { "Next-Action": id, "Content-Type": "text/plain;charset=UTF-8", Accept: "text/x-component", Origin: base, cookie }, body: JSON.stringify(args) });
  return { status: response.status, body: await response.text() };
}

async function main() {
  const user = await prisma.user.create({ data: { email, name: "Post Probe", passwordHash: "unused-probe" } });
  const studio = await prisma.studio.create({ data: { ownerId: user.id, name: "Probe studio", timeZone: "America/Toronto" } });
  const assetId = randomUUID().replaceAll("-", "");
  await prisma.mediaAsset.create({ data: { id: assetId, studioId: studio.id, key: `nails/${studio.id}/${assetId}.png`, mimeType: "image/png", byteSize: 8, width: 32, height: 32 } });
  const replacementAssetId = randomUUID().replaceAll("-", "");
  await prisma.mediaAsset.create({ data: { id: replacementAssetId, studioId: studio.id, key: `nails/${studio.id}/${replacementAssetId}.png`, mimeType: "image/png", byteSize: 8, width: 32, height: 32 } });
  const cookie = `${SESSION_COOKIE}=${await signSession({ userId: user.id, role: user.role })}`;
  try {
    const create = await action("/nails/create", "createNailsPostAction", [[assetId]], cookie);
    check("Authenticated owner can create a post from a library photo", create.status === 200);
    const post = await prisma.nailsPost.findFirstOrThrow({ where: { studioId: studio.id } });
    await prisma.nailsPostAvailability.create({ data: { postId: post.id, startAt: new Date("2030-01-01T15:00:00Z"), endAt: new Date("2030-01-01T16:00:00Z"), timeZone: studio.timeZone } });
    check("Photo order is stored in a Post-specific media relation", await prisma.nailsPostMedia.count({ where: { postId: post.id, mediaAssetId: assetId, position: 0 } }) === 1);
    const save = await action(`/nails/posts/${post.id}`, "saveNailsPostAction", [post.id, { title: "Pink chrome", body: "A real customer design", tags: ["nailart"], theme: "SHOWCASE", template: "WORK", mediaIds: [replacementAssetId] }], cookie);
    check("Draft content and replacement photos persist with owner scope", save.status === 200 && (await prisma.nailsPost.findUniqueOrThrow({ where: { id: post.id } })).title === "Pink chrome" && await prisma.nailsPostMedia.count({ where: { postId: post.id, mediaAssetId: replacementAssetId, position: 0 } }) === 1 && await prisma.nailsPostMedia.count({ where: { postId: post.id, mediaAssetId: assetId } }) === 0);
    check("Draft is re-openable in the protected workspace", (await fetch(`${base}/nails/posts/${post.id}`, { headers: { cookie } })).status === 200);

    const other = await prisma.user.create({ data: { email: `${email}-other`, name: "Other Probe", passwordHash: "unused-probe" } });
    await prisma.studio.create({ data: { ownerId: other.id, name: "Other studio", timeZone: "America/Toronto" } });
    const otherCookie = `${SESSION_COOKIE}=${await signSession({ userId: other.id, role: other.role })}`;
    const foreignPost = await fetch(`${base}/nails/posts/${post.id}`, { headers: { cookie: otherCookie } });
    const foreignBody = await foreignPost.text();
    check("Another studio cannot read the draft content", !foreignBody.includes("Pink chrome") && !foreignBody.includes("A real customer design"));

    const image = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/GfQAAAAASUVORK5CYII=", "base64");
    const form = new FormData(); form.set("image", new Blob([image], { type: "image/png" }), "export.png");
    const exported = await fetch(`${base}/api/nails/posts/${post.id}/export`, { method: "POST", headers: { cookie }, body: form });
    const exportedBody = await exported.text();
    const exportedPost = await prisma.nailsPost.findUniqueOrThrow({ where: { id: post.id } });
    if (exported.status !== 200 || exportedPost.status !== "EXPORTED") console.error("Export route response", exported.status, exportedBody, exportedPost.status);
    check("PNG export is stored and linked to its draft", exported.status === 200 && exportedPost.status === "EXPORTED");
    const record = await prisma.nailsPostExport.findFirstOrThrow({ where: { postId: post.id } });
    check("Anonymous download cannot read private exports", (await fetch(`${base}/api/nails/exports/${record.id}`)).status === 401);
    check("Export history download enforces owner access", (await fetch(`${base}/api/nails/exports/${record.id}`, { headers: { cookie: otherCookie } })).status === 404);
    await checkPostRls(user.id, other.id);

    const duplicate = await action(`/nails/posts/${post.id}`, "duplicateNailsPostAction", [post.id], cookie);
    const copied = await prisma.nailsPost.findFirstOrThrow({ where: { studioId: studio.id, id: { not: post.id } } });
    check("Reusing a post creates an independent draft and keeps its photo", duplicate.status === 200 && copied.title === "Pink chrome" && await prisma.nailsPostMedia.count({ where: { postId: copied.id } }) === 1 && copied.status === "DRAFT");
    const published = await action(`/nails/posts/${post.id}`, "markNailsPostPublishedAction", [post.id], cookie);
    check("Manual publish confirmation is recorded only after export", published.status === 200 && (await prisma.nailsPost.findUniqueOrThrow({ where: { id: post.id } })).status === "PUBLISHED");

    console.log(`NAILS POSTS PROBE PASS (${checks} checks)`);
  } finally {
    const exports = await prisma.nailsPostExport.findMany({ where: { post: { studio: { owner: { email: { in: [email, `${email}-other`] } } } } }, select: { storageKey: true } });
    for (const item of exports) await deleteObject(item.storageKey).catch(() => null);
    await prisma.user.deleteMany({ where: { email: { in: [email, `${email}-other`] } } });
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
