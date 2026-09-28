import { config } from "dotenv";
config({ path: ".env.local" });
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Prisma } from "../src/generated/prisma/client";
import catalog from "../src/data/catalog.json";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  if (process.env.NODE_ENV === "production" || !/@(localhost|127\.0\.0\.1)[:/]/.test(process.env.DATABASE_URL ?? "")) {
    throw new Error("seed 只允许在本地数据库运行（含公开的演示账号密码）");
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

  const admin = await bcrypt.hash("admin12345", 10);
  await prisma.user.upsert({
    where: { phone: "13800000000" },
    create: { phone: "13800000000", name: "平台管理员", passwordHash: admin, role: "ADMIN", source: "OFFLINE" },
    update: {},
  });

  const demo = await bcrypt.hash("demo12345", 10);
  await prisma.user.upsert({
    where: { phone: "13900000000" },
    create: {
      phone: "13900000000",
      name: "林小满",
      passwordHash: demo,
      source: "OFFLINE",
      profile: {
        create: {
          shopName: "小满咖啡",
          wechat: "xiaoman_coffee",
          phone: "139-0000-0000",
          address: "上海市徐汇区武康路 88 号",
          slogan: "每一杯都是今天的小满足",
          activity: "国庆限定：拿铁第二杯半价，10/1–10/7",
        },
      },
    },
    update: {},
  });

  console.log(`seeded templates=${await prisma.template.count()} users=${await prisma.user.count()}`);
}

main().finally(() => prisma.$disconnect());
