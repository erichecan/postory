import { strict as assert } from "node:assert";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { GET } from "../src/app/api/sakura-creative/[id]/route";

async function main() {
const cases = ["footfall", "promote", "repeat", "basket", "offpeak", "awareness", "unsure"];
const digests = new Set<string>();
for (const id of cases) {
  const result = await GET(new Request("http://localhost/api/sakura-creative/" + id), {
    params: Promise.resolve({ id })
  });
  assert.equal(result.status, 200, id + " must render successfully");
  assert.equal(result.headers.get("content-type"), "image/jpeg");
  const image = Buffer.from(await result.arrayBuffer());
  const metadata = await sharp(image).metadata();
  assert.equal(metadata.width, 1080, id + " width");
  assert.equal(metadata.height, 1350, id + " height");
  assert.ok(image.length > 18000, id + " is unexpectedly small");
  const digest = createHash("sha256").update(image).digest("hex");
  assert.ok(!digests.has(digest), id + " duplicated another creative");
  digests.add(digest);
  console.log(id + " JPEG " + image.length + " bytes · 1080×1350");
}
const invalid = await GET(new Request("http://localhost/api/sakura-creative/invalid"), {
  params: Promise.resolve({ id: "invalid" })
});
assert.equal(invalid.status, 404, "unknown creative must not resolve");
console.log("Sakura creative render smoke test: 7/7 distinct images");

}
void main().catch((error) => { console.error(error); process.exitCode = 1; });
