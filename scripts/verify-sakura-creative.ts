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
  // Regression on the exact failure seen in Cloud Run: black boxes barely
  // fill this cream title area, whereas the actual outlined headline does.
  if (id === "footfall") {
    const { data, info } = await sharp(image)
      .extract({ left: 78, top: 1060, width: 820, height: 185 })
      .removeAlpha().raw().toBuffer({ resolveWithObject: true });
    let ink = 0;
    for (let i = 0; i < data.length; i += info.channels) {
      if (data[i] < 110 && data[i + 1] < 125 && data[i + 2] < 120) ink++;
    }
    assert.ok(ink > 9000, "Sakura headline has insufficient visible ink (" + ink + " pixels): font likely rendered as boxes");
    console.log("Footfall final JPEG headline ink pixels: " + ink + " (threshold 9000)");
  }
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
