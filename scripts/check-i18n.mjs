import { readdirSync, readFileSync } from "node:fs";
import { execSync } from "node:child_process";

const dir = "src/i18n/messages";
const flatten = (obj, prefix = "") =>
  Object.entries(obj).flatMap(([k, v]) => (v && typeof v === "object" ? flatten(v, `${prefix}${k}.`) : [[`${prefix}${k}`, v]]));

const load = (locale) =>
  Object.fromEntries(
    readdirSync(`${dir}/${locale}`)
      .filter((f) => f.endsWith(".json"))
      .flatMap((f) => flatten(JSON.parse(readFileSync(`${dir}/${locale}/${f}`, "utf8")), `${f.replace(".json", "")}.`)),
  );

const zh = load("zh");
const en = load("en");
const problems = [];
for (const k of Object.keys(zh)) if (!(k in en)) problems.push(`en 缺 ${k}`);
for (const k of Object.keys(en)) if (!(k in zh)) problems.push(`zh 缺 ${k}`);
for (const [k, v] of [...Object.entries(zh), ...Object.entries(en)]) if (typeof v !== "string" || !v.trim()) problems.push(`空值 ${k}`);
for (const [k, v] of Object.entries(en)) if (/[一-鿿]/.test(v)) problems.push(`en 含中文 ${k}`);

const ALLOW = ["src/lib/demo.ts"];
const hits = execSync(
  `grep -rnIE "[一-龥]" src --include=*.ts --include=*.tsx --exclude-dir=generated --exclude-dir=data --exclude-dir=messages || true`,
  { encoding: "utf8" },
)
  .split("\n")
  .filter(Boolean)
  .filter((line) => !ALLOW.some((p) => line.startsWith(p)))
  .filter((line) => !line.includes("i18n-allow"))
  .filter((line) => !/^\s*(\/\/|\*|\/\*|\{\/\*)/.test(line.replace(/^[^:]+:\d+:/, "")));
for (const h of hits) problems.push(`残留中文 ${h.slice(0, 160)}`);

console.log(`keys zh=${Object.keys(zh).length} en=${Object.keys(en).length}`);
if (problems.length) {
  console.log(problems.join("\n"));
  process.exit(1);
}
console.log("i18n OK");
