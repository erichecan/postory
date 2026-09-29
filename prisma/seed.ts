import { config } from "dotenv";
config({ path: ".env.local" });
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { readFileSync } from "node:fs";
import { PrismaClient, type Prisma } from "../src/generated/prisma/client";
import { DEMO_PROFILE } from "../src/lib/demo";
import { DEFAULT_TIERS } from "./seed-tiers";

type CatalogEntry = {
  id: string;
  source: string;
  title: string;
  description: string;
  platform: string;
  width: number;
  height: number;
  thumbnails: string[];
  pages: unknown;
  editable: boolean;
  sourceUrl: string;
  sortOrder: number;
};

const catalog = JSON.parse(readFileSync("src/data/catalog.json", "utf8")) as CatalogEntry[];
const templatesOnly = process.env.SEED_SCOPE === "templates";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const local = /@(localhost|127\.0\.0\.1)[:/]/.test(process.env.DATABASE_URL ?? "");
  if (!templatesOnly && (process.env.NODE_ENV === "production" || !local)) {
    throw new Error("seed 只允许在本地数据库运行（含公开的演示账号密码）；线上只导模板请加 SEED_SCOPE=templates");
  }
  for (const t of catalog) {
    const data = {
      source: t.source,
      title: t.title,
      description: t.description,
      platform: t.platform,
      width: t.width,
      height: t.height,
      thumbnails: t.thumbnails,
      pages: t.pages as unknown as Prisma.InputJsonValue,
      editable: t.editable,
      sourceUrl: t.sourceUrl,
      sortOrder: t.sortOrder,
    };
    await prisma.template.upsert({ where: { id: t.id }, create: { id: t.id, ...data }, update: data });
  }

  const removed = await prisma.template.deleteMany({ where: { id: { notIn: catalog.map((t) => t.id) } } });
  if (removed.count) console.log(`removed stale templates=${removed.count}`);

  for (const { slug, features, ...tier } of DEFAULT_TIERS) {
    const data = { ...tier, features: features as unknown as Prisma.InputJsonValue };
    await prisma.membershipTier.upsert({ where: { slug }, create: { slug, ...data }, update: {} });
  }
  console.log(`tiers=${await prisma.membershipTier.count()}`);
  if (templatesOnly) {
    console.log(`seeded templates=${await prisma.template.count()}`);
    return;
  }

  const admin = await bcrypt.hash("admin12345", 10);
  await prisma.user.upsert({
    where: { phone: "13800000000" },
    create: { phone: "13800000000", name: "平台管理员", passwordHash: admin, role: "ADMIN", source: "OFFLINE" },
    update: {},
  });

  const demo = await bcrypt.hash("demo12345", 10);
  await prisma.user.upsert({
    where: { phone: "13900000000" },
    create: { phone: "13900000000", name: "林小满", passwordHash: demo, source: "OFFLINE", profile: { create: DEMO_PROFILE } },
    update: {},
  });

  console.log(`seeded templates=${await prisma.template.count()} users=${await prisma.user.count()}`);
}

main().finally(() => prisma.$disconnect());
