import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

// Original PoStory demo-photo sources; never uses external restaurant images or
// silently creates a fictional merchant menu with an image model.
export const runtime = "nodejs";
const W = 1080, H = 1350;
const root = path.join(process.cwd(), "public", "demo", "photos", "restaurant-calendar");

const scenes = {
  footfall: { images: ["lunch-set.jpg"] },
  promote: { images: ["salmon-dragon-roll.jpg"] },
  repeat: { images: ["sushi-night.jpg"] },
  basket: { images: ["guest-favourites.jpg", "bento-lunch.jpg"] },
  offpeak: { images: ["signature.jpg"] },
  awareness: { images: ["chef-nigiri.jpg"] },
  unsure: { images: ["fresh-ingredients.jpg", "roll-made-to-order.jpg", "signature.jpg"] },
} as const;

type Id = keyof typeof scenes;
const X = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const word = (x: number, y: number, value: string, size: number, color = "#172722", weight = 700, extra = "") =>
  '<text x="' + x + '" y="' + y + '" fill="' + color + '" font-family="Arial,Helvetica,sans-serif" font-size="' + size + '" font-weight="' + weight + '" ' + extra + '>' + X(value) + "</text>";
const rect = (x: number, y: number, w: number, h: number, fill: string) =>
  '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + fill + '"/>';
const brand = (color: string, y = 95) =>
  word(70, y, "SAKURA", 37, color, 800, 'letter-spacing="9"') +
  word(70, y + 32, "S U S H I", 16, color, 600, 'letter-spacing="5"');

function overlay(id: Id): string {
  const ink = "#22312b", cream = "#f9f4ea", orange = "#d86d48";
  switch (id) {
    case "footfall":
      return rect(0, 850, W, 500, cream) +
        rect(74, 922, 92, 9, orange) + brand(ink, 1003) +
        word(72, 1133, "MAKE IT A", 66, ink, 700) +
        word(72, 1218, "SUSHI LUNCH.", 88, ink, 850) +
        word(748, 1298, "VIEW THE MENU  ↗", 20, ink, 700);
    case "promote":
      return '<defs><linearGradient id="shade" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#00000000" offset=".18"/><stop stop-color="#111913dd" offset="1"/></linearGradient></defs>' +
        rect(0, 0, W, H, "url(#shade)") +
        rect(65, 76, 330, 53, cream) + word(86, 113, "THE FEATURED ROLL", 22, ink, 800, 'letter-spacing="2"') +
        brand("#ffffff", 210) +
        word(65, 1090, "A ROLL", 97, "#ffffff", 800) +
        word(65, 1200, "WORTH A LOOK.", 78, "#ffffff", 850) +
        word(65, 1285, "EXPLORE THE MENU  ↗", 25, "#ffffff", 650);
    case "repeat":
      return '<defs><linearGradient id="shade" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#140e090f" offset="0"/><stop stop-color="#160e09df" offset="1"/></linearGradient></defs>' +
        rect(0, 0, W, H, "url(#shade)") +
        brand("#fff7e9", 116) +
        word(75, 990, "BACK AROUND THE TABLE.", 51, "#f7e6c3", 500, 'font-family="Georgia,serif" font-style="italic"') +
        word(72, 1115, "SUSHI NIGHT", 94, "#ffffff", 800) +
        word(72, 1225, "AGAIN?", 112, "#ffffff", 800) +
        word(75, 1294, "PLAN YOUR NEXT VISIT  ↗", 22, "#fff7e9", 650);
    case "basket":
      return rect(0, 860, W, 490, cream) +
        brand(ink, 960) +
        word(74, 1090, "SUSHI", 92, ink, 850) +
        word(74, 1180, "TO SHARE.", 92, ink, 850) +
        word(74, 1285, "EXPLORE THE MENU  ↗", 23, orange, 800);
    case "offpeak":
      return rect(0, 0, 535, H, "#c4523d") +
        word(64, 137, "SAKURA / SUSHI", 29, "#fff8e9", 750, 'letter-spacing="4"') +
        word(61, 420, "MAKE", 100, "#fff8e9", 850) +
        word(61, 530, "TIME", 116, "#fff8e9", 850) +
        word(61, 640, "FOR", 109, "#fff8e9", 850) +
        word(61, 750, "SUSHI.", 107, "#fff8e9", 850) +
        rect(63, 807, 195, 8, "#f9d8a8") +
        word(65, 1250, "CHECK OPENING HOURS  ↗", 22, "#fff8e9", 700);
    case "awareness":
      return '<defs><linearGradient id="shade" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#00000030" offset="0"/><stop stop-color="#10140be0" offset="1"/></linearGradient></defs>' +
        rect(0, 0, W, H, "url(#shade)") + brand("#ffffff", 123) +
        word(70, 1070, "BEHIND", 102, "#ffffff", 850) +
        word(70, 1172, "THE SUSHI", 101, "#ffffff", 850) +
        word(70, 1270, "COUNTER.", 101, "#ffffff", 850);
    case "unsure":
      return rect(0, 900, W, 450, cream) +
        rect(66, 978, 92, 9, orange) + brand(ink, 1055) +
        word(64, 1161, "WHICH SUSHI", 83, ink, 850) +
        word(64, 1256, "TONIGHT?", 100, ink, 850);
  }
}

async function photo(name: string, width: number, height: number) {
  const bytes = await readFile(path.join(root, name));
  return sharp(bytes).rotate().resize(width, height, { fit: "cover", position: "attention" }).jpeg({ quality: 86 }).toBuffer();
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!Object.prototype.hasOwnProperty.call(scenes, id)) return new Response("Not found", { status: 404 });
  const entry = scenes[id as Id];
  try {
    const layers: Array<{input: Buffer; top: number; left: number}> = [];
    const put = async (file: string, x: number, y: number, w: number, h: number) => {
      layers.push({ input: await photo(file, w, h), top: y, left: x });
    };
    if (id === "basket") {
      await put(entry.images[0], 0, 0, 540, 860);
      await put(entry.images[1]!, 548, 0, 532, 860);
    } else if (id === "unsure") {
      await put(entry.images[0], 0, 0, 351, 900);
      await put(entry.images[1]!, 365, 0, 351, 900);
      await put(entry.images[2]!, 730, 0, 350, 900);
    } else if (id === "offpeak") {
      await put(entry.images[0], 535, 0, 545, H);
    } else {
      await put(entry.images[0], 0, 0, W, H);
    }
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '">' + overlay(id as Id) + '</svg>';
    layers.push({ input: Buffer.from(svg), top: 0, left: 0 });
    const bytes = await sharp({ create: { width: W, height: H, channels: 3, background: "#f9f4ea" } })
      .composite(layers)
      .jpeg({ quality: 88, mozjpeg: true })
      .toBuffer();
    return new Response(new Uint8Array(bytes), {
      status: 200,
      headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=3600, s-maxage=86400", "X-Content-Type-Options": "nosniff" }
    });
  } catch (error) {
    console.error("Sakura demo creative failed", id, error instanceof Error ? error.message : "unknown");
    return new Response("Creative preview unavailable", { status: 503 });
  }
}
