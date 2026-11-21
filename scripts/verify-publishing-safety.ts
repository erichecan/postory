import { strict as assert } from "node:assert";
import sharp from "sharp";
import { inspectPublishRaster, captionSha256, requireExactApproval } from "../src/lib/publishing/approved-raster";

async function main() {
  const sample = await sharp({create:{width:1080,height:1350,channels:3,background:"#f2eadf"}}).jpeg().toBuffer();
  const first = await inspectPublishRaster(sample);
  assert.equal(first.width,1080);
  assert.equal(first.height,1350);
  assert.equal(first.mime,"image/jpeg");
  const approved = {expectedImageSha:first.sha256,actualImageSha:first.sha256,
    expectedCaptionSha:captionSha256("Actual verified restaurant caption"),
    actualCaption:"Actual verified restaurant caption",approvedAt:new Date()};
  requireExactApproval(approved);
  assert.throws(()=>requireExactApproval({...approved,actualImageSha:"a".repeat(64)}),/approved_asset_changed/);
  assert.throws(()=>requireExactApproval({...approved,actualCaption:"New caption"}),/approved_asset_changed/);
  assert.throws(()=>requireExactApproval({...approved,approvedAt:null}),/approved_asset_changed/);
  await assert.rejects(()=>inspectPublishRaster(Buffer.from("not an image")));
  await assert.rejects(()=>inspectPublishRaster(Buffer.from("<svg></svg>")));
  const tooSmall = await sharp({create:{width:200,height:200,channels:3,background:"#000"}}).png().toBuffer();
  await assert.rejects(()=>inspectPublishRaster(tooSmall),/dimensions/);
  console.log("Publishing safety PASS: format/dimensions/decode, immutable image bytes, caption hash, explicit approval.");
}
void main().catch((e)=>{console.error(e);process.exitCode=1;});
