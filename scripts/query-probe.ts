import "./load-env";
import bcrypt from "bcryptjs";
import type { Prisma } from "../src/generated/prisma/client";
import { prisma, takeQueryCount } from "../src/lib/db/client";
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
  report("listOwnDesigns 查询数不随数据量增长", d10 === d200 && d10 <= 2, `10 条=${d10} 次，200 条=${d200} 次`);

  const p1 = await queriesOf(() => listTemplates({ page: 1 }));
  const p7 = await queriesOf(() => listTemplates({ page: 7 }));
  report("listTemplates 查询数与页码无关", p1 === p7 && p1 <= 3, `第 1 页=${p1} 次，第 7 页=${p7} 次`);

  const page = await listTemplates({ page: 1 });
  report("模板列表分页", page.items.length === TEMPLATES_PER_PAGE && page.pageCount === Math.ceil(page.total / TEMPLATES_PER_PAGE), `每页 ${page.items.length} 条，共 ${page.pageCount} 页`);

  await prisma.user.delete({ where: { id: user.id } });
  await prisma.$disconnect();
  process.exit(fail ? 1 : 0);
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
