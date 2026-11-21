import { strict as assert } from "node:assert";
import sharp from "sharp";
import { validateBrandImage, BrandImageValidationError, MAX_BRAND_IMAGE_PIXELS } from "../src/lib/content-engine/brand-image-validation";

async function shouldReject(bytes:Buffer, mime:string, reason:string){
  await assert.rejects(async()=>validateBrandImage(bytes,mime),(err:unknown)=>
    err instanceof BrandImageValidationError && err.reason===reason);
}
async function main() {
const pixels=Buffer.alloc(120*90*3);
for(let i=0;i<pixels.length;i++) pixels[i]=(i*17+Math.floor(i/3)*13)%256;
const raw={raw:{width:120,height:90,channels:3 as const}};
const png=await sharp(pixels,raw).png().toBuffer();
const jpeg=await sharp(pixels,raw).jpeg().toBuffer();
const webp=await sharp(pixels,raw).webp().toBuffer();
for(const [bytes,mime] of [[png,"image/png"],[jpeg,"image/jpeg"],[webp,"image/webp"]] as const){
  const result=await validateBrandImage(bytes,mime);
  assert.equal(result.mime,mime);
  assert.equal(result.width,120);assert.equal(result.height,90);
}
await shouldReject(png,"image/jpeg","invalid_image_type");
await shouldReject(Buffer.from("not a real image".repeat(12)),"image/jpeg","invalid_image_type");
await shouldReject(Buffer.concat([png.subarray(0,50),Buffer.alloc(110)]),"image/png","image_decode_failed");
const big=await sharp({create:{width:5000,height:4000,channels:3,background:{r:22,g:55,b:77}}}).png().toBuffer();
assert.ok(5000*4000>MAX_BRAND_IMAGE_PIXELS);
await shouldReject(big,"image/png","image_dimensions_exceeded");
console.log("PASS: Brand image decoding, MIME checks, corrupted files, and pixel limits.");

}
void main().catch(error=>{console.error(error);process.exitCode=1;});
