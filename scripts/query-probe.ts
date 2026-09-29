import "./load-env";
import bcrypt from "bcryptjs";
import type { Prisma } from "../src/generated/prisma/client";
import { prisma, takeQueryCount } from "../src/lib/db/client";
import { getBalanceAt, listTxns, TXN_PAGE_SIZE } from "../src/lib/db/credits";
import { listOwnDesigns } from "../src/lib/db/designs";
import { listTemplates, TEMPLATES_PER_PAGE } from "../src/lib/db/templates";

async function queriesOf(fn: () => Promise<unknown>) {
  takeQueryCount();
  await fn();
  return takeQueryCount();
}

async function main() {
  if (process.env.PRISMA_QUERY_COUNT !== "1") throw new Error("需以 PRISMA_QUERY_COUNT=1 运行");
  const user = await prisma.user.upsert({
    where: { phone: "19900000100" },
    create: { phone: "19900000100", name: "查询探针", passwordHash: await bcrypt.hash("x", 4) },
    update: {},
  });
  const tpl = await prisma.template.findFirstOrThrow();
  const seed = async (n: number) => {
    await prisma.design.deleteMany({ where: { userId: user.id } });
    await prisma.design.createMany({
      data: Array.from({ length: n }, (_, i) => ({ userId: user.id, templateId: tpl.id, title: `d${i}`, pages: tpl.pages as Prisma.InputJsonValue })),
    });
  };

  let fail = 0;
  const report = (name: string, ok: boolean, detail: string) => {
    if (!ok) fail++;
    console.log(`${ok ? "PASS" : "FAIL"}  ${name}  (${detail})`);
  };

  await seed(10);
  const d10 = await queriesOf(() => listOwnDesigns(user.id));
  await seed(200);
  const d200 = await queriesOf(() => listOwnDesigns(user.id));
  report("listOwnDesigns 查询数不随数据量增长", d10 === d200 && d10 <= 5, `10 条=${d10} 次，200 条=${d200} 次`);

  const p1 = await queriesOf(() => listTemplates({ page: 1 }));
  const p7 = await queriesOf(() => listTemplates({ page: 7 }));
  report("listTemplates 查询数与页码无关", p1 === p7 && p1 <= 3, `第 1 页=${p1} 次，第 7 页=${p7} 次`);

  const mine = await listOwnDesigns(user.id);
  report("我的作品草稿分页", mine.drafts.length === 24 && mine.draftPageCount === Math.ceil(200 / 24), `每页 ${mine.drafts.length} 条，共 ${mine.draftPageCount} 页`);
  const page = await listTemplates({ page: 1 });
  report("模板列表分页", page.items.length === TEMPLATES_PER_PAGE && page.pageCount === Math.ceil(page.total / TEMPLATES_PER_PAGE), `每页 ${page.items.length} 条，共 ${page.pageCount} 页`);

  const seedTxns = async (n: number) => {
    await prisma.creditGrant.deleteMany({ where: { userId: user.id } });
    await prisma.creditTxn.deleteMany({ where: { userId: user.id } });
    await prisma.creditGrant.createMany({ data: Array.from({ length: n }, () => ({ userId: user.id, source: "TOPUP" as const, amount: 1, remaining: 1 })) });
    await prisma.creditTxn.createMany({ data: Array.from({ length: n }, (_, i) => ({ userId: user.id, kind: "GRANT" as const, source: "TOPUP" as const, delta: 1, refId: `q-${i}` })) });
  };
  await seedTxns(10);
  const t10 = await queriesOf(() => Promise.all([listTxns(user.id), getBalanceAt(user.id, new Date())]));
  await seedTxns(200);
  const t200 = await queriesOf(() => Promise.all([listTxns(user.id), getBalanceAt(user.id, new Date())]));
  report("流水与余额查询数不随数据量增长", t10 === t200 && t10 <= 3, `10 条=${t10} 次，200 条=${t200} 次`);
  const txns = await listTxns(user.id);
  report("流水分页", txns.items.length === TXN_PAGE_SIZE && txns.pageCount === Math.ceil(200 / TXN_PAGE_SIZE), `每页 ${txns.items.length} 条，共 ${txns.pageCount} 页`);

  await prisma.user.delete({ where: { id: user.id } });
  await prisma.$disconnect();
  process.exit(fail ? 1 : 0);
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
