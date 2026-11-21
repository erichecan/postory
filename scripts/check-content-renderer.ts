import { strict as assert } from "node:assert";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { newBrandProfileDraft } from "../src/lib/content-engine/brand-profile";
import { submitBrandForReview, decideBrandReview, reviseApprovedBrand, BrandApprovalError } from "../src/lib/content-engine/brand-approval";
import { renderContentMedia, ContentRenderError } from "../src/lib/content-engine/deterministic-renderer";
import { validateOffer, type OfferFacts } from "../src/lib/content-engine/offers";
import { parseContentApprovalInput, createApprovedContentManifest, isApprovedContentManifest, contentApprovalDigest } from "../src/lib/content-engine/content-approval";

async function main() {
  const promo:OfferFacts = {
    type:"bundle",title:"Lunch combo",items:["Salmon Roll","Miso Soup"],currency:"CAD",price:22.99,
    startDate:"2026-11-23",endDate:"2026-11-30",timezone:"America/Toronto",
    channels:["dine_in"],confirmedByMerchant:true,limitations:"Dine in only"
  };
  const check=validateOffer("sushi",promo);
  assert.equal(check.valid,true,JSON.stringify(check.blockers));
  assert.ok(check.imageLabel?.includes("22.99"));
  assert.ok(check.fullDisclosure.includes("Dine in only"));
  assert.ok(!validateOffer("roofing",promo).valid,"restaurant bundles not offered to roofers");
  assert.ok(validateOffer("sushi",{...promo,confirmedByMerchant:false}).blockers.includes("unconfirmed_offer"));
  assert.ok(validateOffer("sushi",{...promo,startDate:"2026-11-31"}).blockers.includes("invalid_dates"));
  assert.ok(validateOffer("sushi",{...promo,regularPrice:30,confirmedByMerchant:false}).blockers.includes("unverified_comparison_price"));

  const brand=newBrandProfileDraft({
    tenantId:"shop-123456789012",profileId:"brand-1",industry:"sushi",businessName:"Sakura Sushi",
    serviceArea:"Toronto",locale:"en",now:"2026-11-21T16:00:00Z",
  });
  const original=await sharp({create:{width:600,height:800,channels:3,background:{r:174,g:93,b:83}}}).jpeg().toBuffer();
  const sha=createHash("sha256").update(original).digest("hex");
  brand.assets=[{
    assetId:"photo-1",kind:"product",originalStorageKey:"private/shop/photo.jpg",
    sha256:sha,sourcePermission:"merchant_owned",approvedForPublishing:true,
  }];
  for(const template of ["food-editorial","product-feature","local-story"] as const){
    const result=await renderContentMedia({profile:brand,photo:original,template,
      format:"portrait",headline:"A lunch worth coming back for",subheadline:"Fresh every day",
      cta:"View menu",offer:promo,mode:"preview"});
    const m=await sharp(result.bytes).metadata();
    assert.equal(m.format,"png");
    assert.equal(m.width,1080);assert.equal(m.height,1350);
    assert.equal(result.preview,true);
    assert.ok(result.bytes.length>4000);
  }
  await assert.rejects(async()=>renderContentMedia({profile:brand,photo:original,
      template:"food-editorial",format:"square",headline:"Sushi",mode:"publish",sourceAssetId:"photo-1"}),
    e=>e instanceof ContentRenderError && e.reason==="profile_not_approved");
  brand.businessName.status="merchant_confirmed";
  brand.serviceArea.status="merchant_confirmed";
  brand.preferredLocale.status="merchant_confirmed";
  const submitted=submitBrandForReview(brand,"merchant-1","2026-11-21T16:01:00Z");
  assert.equal(brand.status,"draft","transitions must not mutate the source");
  assert.equal(submitted.event.action,"submitted");
  const approved=decideBrandReview(submitted.profile,"merchant-1","approve","2026-11-21T16:02:00Z");
  assert.equal(approved.profile.status,"approved");
  assert.equal(approved.profile.approvedBy,"merchant-1");
  assert.equal(approved.event.version,1);
  Object.assign(brand,approved.profile);
  const revision=reviseApprovedBrand(approved.profile,"merchant-1","2026-11-21T16:03:00Z");
  assert.equal(revision.profile.version,2);
  assert.equal(revision.profile.status,"draft");
  assert.equal(revision.profile.approvedAt,undefined);
  assert.equal(approved.profile.status,"approved","approved snapshot must remain unchanged");
  assert.throws(()=>decideBrandReview(approved.profile,"merchant-1","approve","2026-11-21T16:04:00Z"),
    e=>e instanceof BrandApprovalError && e.reason==="not_pending_review");
  const missingProvenance={...brand,approvedBy:undefined};
  await assert.rejects(async()=>renderContentMedia({profile:missingProvenance,photo:original,
      template:"food-editorial",format:"square",headline:"Sushi",mode:"publish",sourceAssetId:"photo-1"}),
    e=>e instanceof ContentRenderError && e.reason==="profile_not_approved");
  const publish=await renderContentMedia({profile:brand,photo:original,
    sourceAssetId:"photo-1",template:"product-feature",format:"square",
    headline:"A fresh sushi lunch",cta:"Visit us",offer:promo,mode:"publish"});
  assert.equal(publish.preview,false);
  assert.equal((await sharp(publish.bytes).metadata()).width,1080);
  await assert.rejects(async()=>renderContentMedia({profile:brand,photo:original,
      template:"product-feature",format:"square",headline:"Sushi",mode:"publish",sourceAssetId:"missing"}),
    e=>e instanceof ContentRenderError && e.reason==="unapproved_source_asset");
  await assert.rejects(async()=>renderContentMedia({profile:brand,photo:original,
      template:"product-feature",format:"square",headline:"Sushi",mode:"publish",sourceAssetId:"photo-1",
      offer:{...promo,confirmedByMerchant:false}}),
    e=>e instanceof ContentRenderError && e.reason==="offer_not_confirmed");
  // Exact customer-confirmed copy must survive audit serialization unchanged.
  const contentInput={
    shopId:"shop1234567890",brandApprovalEventId:"approval1234567890",
    brandRevision:4,assetId:"a".repeat(24),format:"square",
    template:"food-editorial",headline:"Fresh Sushi",subheadline:"Visit us today",cta:"View menu"
  };
  const parsed=parseContentApprovalInput(contentInput);
  assert.ok(parsed,"valid non-promotional content required");
  const manifest=createApprovedContentManifest(parsed,"merchant-1","2026-11-21T16:05:00Z");
  assert.ok(isApprovedContentManifest(JSON.parse(JSON.stringify(manifest))));
  assert.equal(manifest.digest,contentApprovalDigest(parsed));
  assert.equal(isApprovedContentManifest({...manifest,headline:"UNAPPROVED 90% OFF"}),false,
    "changed copy must never reuse prior approval");
  assert.equal(isApprovedContentManifest({...manifest,assetId:"b".repeat(24)}),false,
    "changed image must never reuse prior approval");
  assert.equal(isApprovedContentManifest({...manifest,brandRevision:5}),false,
    "changed brand revision must never reuse prior approval");
  assert.equal(parseContentApprovalInput({...contentInput,offer:promo}),null,
    "promotions need a disclosure-safe layout before export");
  assert.equal(parseContentApprovalInput({...contentInput,headline:"\u0000Hidden"}),null);
  assert.equal(parseContentApprovalInput({...contentInput,assetId:"wrong"}),null);
  console.log("PASS: industry offer rules, three deterministic PNG layouts, and publish-only confirmed fact/asset gates.");
}
void main().catch(error=>{console.error(error);process.exitCode=1;});
