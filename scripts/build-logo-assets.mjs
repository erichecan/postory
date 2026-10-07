// Rebuild exact PNG crops and optional traced SVG derivatives.
// Optional tracing dependency: npm install --prefix /tmp/postory-logo-tools potrace
// Run: NODE_PATH=/tmp/postory-logo-tools/node_modules node scripts/build-logo-assets.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import sharp from "sharp";
const loadTool = createRequire(import.meta.url);
const { Potrace } = loadTool("potrace");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
async function traceMask(data, width, height, test) {
  const mask = Buffer.alloc(width * height, 255);
  for (let i = 0; i < mask.length; i++) if (test(data, i * 4)) mask[i] = 0;
  const png = await sharp(mask, { raw: { width, height, channels: 1 } })
    .median(3)
    .blur(0.6)
    .png()
    .toBuffer();
  return new Promise((resolve, reject) => {
    const trace = new Potrace({
      threshold: 128,
      turdSize: 12,
      alphaMax: 1,
      optTolerance: 0.4,
    });
    trace.loadImage(png, (e) => (e ? reject(e) : resolve(trace.getPathTag())));
  });
}
async function main() {
  for (const [key, rect] of [
    ["wordmark", { left: 122, top: 290, width: 959, height: 258 }],
    ["symbol", { left: 1185, top: 200, width: 432, height: 437 }],
  ]) {
    const input = sharp(root + "/public/brand/postory-logo-source.png").extract(
      rect,
    );
    await input
      .clone()
      .png()
      .toFile(root + `/public/brand/postory-${key}-v2.png`);
    const { data, info } = await input
      .clone()
      .raw()
      .toBuffer({ resolveWithObject: true });
    let content;
    if (key === "wordmark") {
      const pink = await traceMask(
        data,
        info.width,
        info.height,
        (d, i) => d[i + 3] >= 128 && d[i + 1] < 50,
      );
      const orange = await traceMask(
        data,
        info.width,
        info.height,
        (d, i) => d[i + 3] >= 128 && d[i + 1] >= 50,
      );
      content = `<defs><linearGradient id="pink" x2="0" y2="1"><stop stop-color="#FC0878"/><stop offset="1" stop-color="#FF007A"/></linearGradient><linearGradient id="orange" x2="0" y2="1"><stop stop-color="#FC6000"/><stop offset="1" stop-color="#FF6500"/></linearGradient></defs>${pink.replace('fill="black"', 'fill="url(#pink)"')}${orange.replace('fill="black"', 'fill="url(#orange)"')}`;
    } else {
      const contour = await traceMask(
        data,
        info.width,
        info.height,
        (d, i) => d[i + 3] >= 128,
      );
      const pink = await traceMask(
        data,
        info.width,
        info.height,
        (d, i) =>
          d[i + 3] >= 128 &&
          d[i] > 180 &&
          d[i + 2] > 60 &&
          d[i + 2] > d[i + 1] + 30,
      );
      const white = await traceMask(
        data,
        info.width,
        info.height,
        (d, i) =>
          d[i + 3] >= 128 && d[i] > 200 && d[i + 1] > 200 && d[i + 2] > 200,
      );
      content = `<defs><linearGradient id="orange" x2="0" y2="1"><stop stop-color="#FF8700"/><stop offset="1" stop-color="#FF5F00"/></linearGradient><linearGradient id="pink" x2="0" y2="1"><stop stop-color="#FF007A"/><stop offset="1" stop-color="#FF0085"/></linearGradient></defs>${contour.replace('fill="black"', 'fill="url(#orange)"')}${pink.replace('fill="black"', 'fill="url(#pink)"')}${white.replace('fill="black"', 'fill="#FFFFFF"')}`;
    }
    fs.writeFileSync(
      root + `/public/brand/postory-${key}-v2.svg`,
      `<svg xmlns="http://www.w3.org/2000/svg" width="${info.width}" height="${info.height}" viewBox="0 0 ${info.width} ${info.height}"><title>PoStory ${key}</title>${content}</svg>\n`,
    );
    console.log(key, info.width, info.height);
  }
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
