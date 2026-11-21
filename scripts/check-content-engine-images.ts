import { strict as assert } from "node:assert";
import sharp from "sharp";
import { validateBrandImage, BrandImageValidationError, MAX_BRAND_IMAGE_PIXELS } from "../src/lib/content-engine/brand-image-validation";

async function shouldReject(bytes:Buffer, mime:string, reason:string){
  await assert.rejects(async()=>validateBrandImage(bytes,mime),(err:unknown)=>
    err instanceof BrandImageValidationError && err.reason===reason);
}
const png=await sharp({create:{width:40,height:50,channels:4,background:{r:120,g:45,b:65,alpha:1}}}).png().toBuffer();
const jpeg=await sharp({create:{width:40,height:50,channels:3,background:{r:100,g:140,b:180}}}).jpeg().toBuffer();
const webp=await sharp({create:{width:40,height:50,channels:3,background:{r:30,g:50,b:70}}}).webp().toBuffer();
for(const [bytes,mime] of [[png,"image/png"],[jpeg,"image/jpeg"],[webp,"image/webp"]] as const){
  const result=await validateBrandImage(bytes,mime);
  assert.equal(result.mime,mime);
  assert.equal(result.width,40);assert.equal(result.height,50);
}
await shouldReject(png,"image/jpeg","invalid_image_type");
await shouldReject(Buffer.from("not a real image".repeat(12)),"image/jpeg","invalid_image_type");
await shouldReject(Buffer.concat([png.subarray(0,50),Buffer.alloc(110)]),"image/png","image_decode_failed");
const big=await sharp({create:{width:5000,height:4000,channels:3,background:{r:22,g:55,b:77}}}).png().toBuffer();
assert.ok(5000*4000>MAX_BRAND_IMAGE_PIXELS);
await shouldReject(big,"image/png","image_dimensions_exceeded");
console.log("PASS: Brand image decoding, MIME checks, corrupted files, and pixel limits.");
