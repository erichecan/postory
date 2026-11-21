/**
 * Postgres integration checks for the Content Engine ownership model.
 * Runs only against an isolated CI database after prisma migrate deploy.
 */
import { strict as assert } from "node:assert";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

if (process.env.CONTENT_ENGINE_TEST_DB !== "1") {
  throw new Error("Refusing to run: CONTENT_ENGINE_TEST_DB=1 required");
}
if (!process.env.DATABASE_URL || /prod|production|cloudsql|googleapis/i.test(process.env.DATABASE_URL)) {
  throw new Error("Use an isolated local Postgres DATABASE_URL only");
}

const prisma = new PrismaClient({adapter: new PrismaPg({connectionString: process.env.DATABASE_URL})});
const prefix = "content-engine-ci-" + process.pid;
const ownerA = prefix + "-a";
const ownerB = prefix + "-b";
try {
  // CI-local users. The production authentication layer is not exercised here.
  await prisma.user.createMany({data:[
    {id:ownerA,name:"Brand CI A",passwordHash:"integration-test-no-login"},
    {id:ownerB,name:"Brand CI B",passwordHash:"integration-test-no-login"},
  ]});
  const [shopA,shopB,shopOtherOwner] = await Promise.all([
    prisma.contentBrandShop.create({data:{ownerId:ownerA,name:"Sushi A",industry:"sushi"}}),
    prisma.contentBrandShop.create({data:{ownerId:ownerA,name:"Sushi B",industry:"sushi"}}),
    prisma.contentBrandShop.create({data:{ownerId:ownerB,name:"Sushi C",industry:"sushi"}})
  ]);
  assert.notEqual(shopA.id,shopB.id);
  assert.equal((await prisma.contentBrandShop.findMany({where:{ownerId:ownerA}})).length,2);
  assert.equal((await prisma.contentBrandShop.findMany({where:{ownerId:ownerB}})).length,1);
  assert.equal(await prisma.contentBrandShop.findFirst({where:{id:shopOtherOwner.id,ownerId:ownerA}}),null);
  assert.equal(await prisma.contentBrandShop.findFirst({where:{id:shopB.id,ownerId:ownerB}}),null);

  // Independent brand profile versions and privacy boundaries.
  const profileA=await prisma.contentBrandProfile.create({data:{
    shopId:shopA.id,revision:1,data:{shopName:"Sushi A",status:"draft"}
  }});
  const profileB=await prisma.contentBrandProfile.create({data:{
    shopId:shopB.id,revision:1,data:{shopName:"Sushi B",status:"draft"}
  }});
  assert.notEqual(profileA.id,profileB.id);
  const updated=await prisma.contentBrandProfile.updateMany({where:{shopId:shopA.id,revision:1},
    data:{revision:{increment:1},data:{shopName:"Sushi A",status:"draft",revision:2}}});
  assert.equal(updated.count,1);
  assert.equal((await prisma.contentBrandProfile.findUniqueOrThrow({where:{shopId:shopB.id}})).revision,1);
  assert.equal((await prisma.contentBrandProfile.updateMany({where:{shopId:shopA.id,revision:1},
    data:{revision:{increment:1}}})).count,0,"stale edits must not overwrite newer revisions");

  const asset=await prisma.contentBrandAsset.create({data:{
    shopId:shopA.id,kind:"product",key:`content-brand/${shopA.id}/${"a".repeat(24)}.webp`,
    mime:"image/webp",sha256:"f".repeat(64),byteSize:15000,
  }});
  assert.equal(await prisma.contentBrandAsset.findFirst({
    where:{id:asset.id,shop:{ownerId:ownerB}}
  }),null,"cross-owner asset access must not resolve");
  assert.equal(await prisma.contentBrandAsset.findFirst({
    where:{id:asset.id,shopId:shopB.id}
  }),null,"same-owner different-shop asset cannot be attached by shopId");
  assert.equal((await prisma.contentBrandAsset.findMany({
    where:{shopId:shopA.id,id:{in:[asset.id]}}
  })).length,1);
  assert.equal((await prisma.contentBrandAsset.findMany({
    where:{shopId:shopB.id,id:{in:[asset.id]}}
  })).length,0);

  await prisma.contentBrandShop.delete({where:{id:shopA.id}});
  assert.equal(await prisma.contentBrandProfile.findUnique({where:{shopId:shopA.id}}),null);
  assert.equal(await prisma.contentBrandAsset.findUnique({where:{id:asset.id}}),null);
  assert.ok(await prisma.contentBrandProfile.findUnique({where:{shopId:shopB.id}}));

  process.stdout.write("PASS: multi-shop isolation, asset ownership, revision conflicts, cascading deletes (Postgres)\n");
} finally {
  await prisma.user.deleteMany({where:{id:{in:[ownerA,ownerB]}}});
  await prisma.$disconnect();
}
