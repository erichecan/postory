/**
 * Postgres integration checks for the Content Engine ownership model.
 * Runs only against an isolated CI database after prisma migrate deploy.
 */
import { strict as assert } from "node:assert";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
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

  const submitted=await prisma.$transaction(async tx=>{
    const cas=await tx.contentBrandProfile.updateMany({
      where:{shopId:shopA.id,revision:2},
      data:{revision:{increment:1},data:{shopName:"Sushi A",status:"pending_review",version:3}}
    });
    assert.equal(cas.count,1);
    return tx.contentBrandReviewEvent.create({
      data:{shopId:shopA.id,actorUserId:ownerA,event:"submitted_for_review",revision:3,
        snapshot:{shopName:"Sushi A",status:"pending_review",version:3}}
    });
  });
  assert.equal(submitted.revision,3);
  assert.equal((await prisma.contentBrandReviewEvent.findMany({where:{shopId:shopA.id}})).length,1);
  assert.equal((await prisma.contentBrandReviewEvent.findMany({where:{shopId:shopB.id}})).length,0);
  assert.equal((await prisma.contentBrandReviewEvent.findMany({where:{shopId:shopOtherOwner.id}})).length,0);
  assert.equal((await prisma.contentBrandProfile.findUniqueOrThrow({where:{shopId:shopA.id}})).revision,3);

  // A review decision updates the same profile revision and audit ledger atomically.
  // This verifies persistence semantics independently from the HTTP session layer.
  const decision=await prisma.$transaction(async tx=>{
    const changed=await tx.contentBrandProfile.updateMany({
      where:{shopId:shopA.id,revision:3},
      data:{revision:{increment:1},data:{shopName:"Sushi A",status:"approved",version:4,approvedBy:ownerA}}
    });
    assert.equal(changed.count,1);
    return tx.contentBrandReviewEvent.create({
      data:{shopId:shopA.id,actorUserId:ownerA,event:"approved_by_merchant",revision:4,
        snapshot:{shopName:"Sushi A",status:"approved",version:4,approvedBy:ownerA}}
    });
  });
  assert.equal(decision.revision,4);
  assert.equal((await prisma.contentBrandProfile.findUniqueOrThrow({where:{shopId:shopA.id}})).revision,4);
  assert.equal((await prisma.contentBrandReviewEvent.findMany({where:{shopId:shopA.id}})).length,2);
  assert.equal((await prisma.contentBrandProfile.updateMany({where:{shopId:shopA.id,revision:3},
    data:{revision:{increment:1}}})).count,0,"stale approval must fail compare-and-swap");

  // The prior approved revision remains selectable after creating a new draft.
  await prisma.$transaction(async tx=>{
    const changed=await tx.contentBrandProfile.updateMany({
      where:{shopId:shopA.id,revision:4},
      data:{revision:{increment:1},data:{shopName:"Sushi A",status:"draft",version:5}}
    });
    assert.equal(changed.count,1);
    await tx.contentBrandReviewEvent.create({
      data:{shopId:shopA.id,actorUserId:ownerA,event:"new_draft_revision",revision:5,
        snapshot:{shopName:"Sushi A",status:"draft",version:5}}
    });
  });
  const history=await prisma.contentBrandReviewEvent.findFirst({
    where:{shopId:shopA.id,event:"approved_by_merchant"},orderBy:{revision:"desc"}
  });
  assert.equal(history?.revision,4,"approved revision must persist after later draft");
  assert.equal((history?.snapshot as {status?:string})?.status,"approved");
  assert.equal((await prisma.contentBrandProfile.findUniqueOrThrow({where:{shopId:shopA.id}})).revision,5);
  assert.equal((await prisma.contentBrandReviewEvent.findMany({where:{shopId:shopB.id}})).length,0);
  assert.equal((await prisma.contentBrandReviewEvent.findMany({where:{shopId:shopA.id}})).length,3);

  // An error after the profile update must roll back both profile and event.
  await assert.rejects(prisma.$transaction(async tx=>{
    const updated=await tx.contentBrandProfile.updateMany({
      where:{shopId:shopA.id,revision:5},
      data:{revision:{increment:1},data:{status:"draft",version:6}}
    });
    assert.equal(updated.count,1);
    throw new Error("simulate_review_event_failure");
  }),/simulate_review_event_failure/);
  assert.equal((await prisma.contentBrandProfile.findUniqueOrThrow({where:{shopId:shopA.id}})).revision,5,
    "failed review transaction must not advance revision");
  assert.equal((await prisma.contentBrandReviewEvent.findMany({where:{shopId:shopA.id}})).length,3,
    "failed review transaction must not append an audit event");
  assert.equal((await prisma.contentBrandReviewEvent.findMany({where:{shopId:shopOtherOwner.id}})).length,0);

  await prisma.contentBrandShop.delete({where:{id:shopA.id}});
  assert.equal(await prisma.contentBrandProfile.findUnique({where:{shopId:shopA.id}}),null);
  assert.equal(await prisma.contentBrandAsset.findUnique({where:{id:asset.id}}),null);
  assert.equal((await prisma.contentBrandReviewEvent.findMany({where:{shopId:shopA.id}})).length,0);
  assert.ok(await prisma.contentBrandProfile.findUnique({where:{shopId:shopB.id}}));

  process.stdout.write("PASS: multi-shop isolation, asset ownership, revision conflicts, cascading deletes (Postgres)\n");
} finally {
  await prisma.user.deleteMany({where:{id:{in:[ownerA,ownerB]}}});
  await prisma.$disconnect();
}

}
void main().catch(error=>{console.error(error);process.exitCode=1;});
