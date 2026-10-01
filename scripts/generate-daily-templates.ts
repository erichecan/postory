import { config } from "dotenv";
config({ path: ".env.local" });
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Prisma } from "../src/generated/prisma/client";

type IndustryType = "service" | "product";
type Industry = { slug: string; name: string; type: IndustryType };

const INDUSTRIES: Industry[] = [
  { slug: "restaurant", name: "餐饮", type: "service" },
  { slug: "nail", name: "美甲", type: "service" },
  { slug: "beauty", name: "美容", type: "service" },
  { slug: "hair", name: "美发", type: "service" },
  { slug: "fitness", name: "健身", type: "service" },
  { slug: "phonecase", name: "手机壳批发", type: "product" },
  { slug: "phonerepair", name: "手机维修", type: "product" },
  { slug: "cable", name: "数据线", type: "product" },
  { slug: "3c", name: "3C数码产品", type: "product" },
];

const GENERIC_THEMES: Record<IndustryType, string[]> = {
  service: ["新店开业", "会员专享福利", "限时折扣", "新服务上市", "老客户回馈日"],
  product: ["新品到货", "批发价格优惠", "以旧换新", "套餐组合促销", "限时秒杀"],
};

const COUNT_PER_DAY = 10;

type CalendarEvent = { start: string; end: string; name: string };

function todayEvent(ymd: string): string | null {
  const calendar: CalendarEvent[] = JSON.parse(readFileSync("src/data/marketing-calendar.json", "utf8"));
  const hit = calendar.find((e) => ymd >= e.start && ymd <= e.end);
  return hit?.name ?? null;
}

function daysSinceEpoch(date: Date): number {
  return Math.floor(date.getTime() / 86400000);
}

type Slot = { industry: Industry; theme: string; isCalendarEvent: boolean };

function buildSlots(date: Date, ymd: string): Slot[] {
  const dayIdx = daysSinceEpoch(date);
  const event = todayEvent(ymd);
  const slots: Slot[] = [];
  for (let i = 0; i < COUNT_PER_DAY; i++) {
    const industry = INDUSTRIES[(dayIdx * COUNT_PER_DAY + i) % INDUSTRIES.length];
    const theme = event ?? GENERIC_THEMES[industry.type][(dayIdx + i) % GENERIC_THEMES[industry.type].length];
    slots.push({ industry, theme, isCalendarEvent: !!event });
  }
  return slots;
}

const SCHEMA = readFileSync("scripts/templates-gen/design-page.schema.json", "utf8");
const SYSTEM_PROMPTS: Record<IndustryType, string> = {
  service: readFileSync("scripts/templates-gen/system-prompt-service.txt", "utf8"),
  product: readFileSync("scripts/templates-gen/system-prompt-product.txt", "utf8"),
};

type ClaudeResult = {
  structured_output?: { name: string; width: number; height: number; background: string; elements: unknown[] };
  total_cost_usd: number;
  usage: {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens: number;
    cache_read_input_tokens: number;
  };
  is_error: boolean;
};

function generateOne(industry: Industry, theme: string): ClaudeResult {
  const userPrompt = `行业：${industry.name}\n主题：${theme}\n请输出今天的 DesignPage。`;
  const out = execFileSync(
    "claude",
    [
      "--print",
      "--safe-mode",
      "--disallowedTools",
      "Bash,Read,Write,Edit,Glob,Grep,WebFetch,WebSearch,Task,TodoWrite,NotebookEdit",
      "--model",
      "claude-sonnet-5",
      "--append-system-prompt",
      SYSTEM_PROMPTS[industry.type],
      "--json-schema",
      SCHEMA,
      "--output-format",
      "json",
      "--no-session-persistence",
      userPrompt,
    ],
    { encoding: "utf8", maxBuffer: 1024 * 1024 * 20, timeout: 120_000 },
  );
  return JSON.parse(out) as ClaudeResult;
}

function platformOf(w: number, h: number): string {
  if (w === 1080 && h === 1920) return "instagram-story";
  return "instagram-post";
}

function localYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

async function main() {
  const date = new Date();
  const ymd = localYmd(date);
  const slots = buildSlots(date, ymd);

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

  const results: Array<Record<string, unknown>> = [];
  let totalCost = 0;

  for (const [i, slot] of slots.entries()) {
    try {
      const res = generateOne(slot.industry, slot.theme);
      totalCost += res.total_cost_usd ?? 0;
      if (res.is_error || !res.structured_output) {
        // CLI 命中订阅额度上限时经常退出码仍是 0，只在文本里提示，必须显式识别出来，
        // 不然会把"额度用完"误当成普通生成失败，白白把剩下的几个 slot 也跑废。
        const hint = JSON.stringify(res).toLowerCase();
        if (/limit|quota|usage cap|upgrade your plan/.test(hint)) {
          console.error(`[${i + 1}/${slots.length}] 疑似触发 Claude 订阅额度上限，停止本次剩余生成\n${hint.slice(0, 300)}`);
          results.push({ ...slot, ok: false, error: "quota_exhausted" });
          break;
        }
        results.push({ ...slot, ok: false, error: "no structured_output" });
        console.error(`[${i + 1}/${slots.length}] 无结构化输出: ${slot.industry.name} / ${slot.theme}`);
        continue;
      }
      const page = res.structured_output;
      const id = `ai-${slot.industry.slug}-${ymd}-${i + 1}`;
      const data = {
        source: "ai-generated",
        title: `${slot.theme} · ${slot.industry.name}`,
        description: `AI 每日自动生成草稿，${ymd} 生成，主题：${slot.theme}`,
        categories: [slot.industry.name],
        status: "draft",
        platform: platformOf(page.width, page.height),
        width: page.width,
        height: page.height,
        thumbnails: [] as string[],
        pages: [page] as unknown as Prisma.InputJsonValue,
        editable: true,
        sourceUrl: "",
        sortOrder: 0,
      };
      await prisma.template.upsert({ where: { id }, create: { id, ...data }, update: data });
      results.push({ ...slot, ok: true, id, cost: res.total_cost_usd, usage: res.usage });
      console.log(
        `[${i + 1}/${slots.length}] ${slot.industry.name} / ${slot.theme} -> ${id} ($${res.total_cost_usd.toFixed(4)})`,
      );
    } catch (e) {
      results.push({ ...slot, ok: false, error: String(e) });
      console.error(`[${i + 1}/${slots.length}] 失败: ${slot.industry.name} / ${slot.theme}`, e);
      if (/limit|quota|usage cap|upgrade your plan/i.test(String(e))) {
        console.error("疑似触发 Claude 订阅额度上限，停止本次剩余生成");
        break;
      }
    }
  }

  await prisma.$disconnect();

  const logDir = "docs/ai-template-gen-log";
  if (!existsSync(logDir)) mkdirSync(logDir, { recursive: true });
  writeFileSync(`${logDir}/${ymd}.json`, JSON.stringify({ date: ymd, totalCost, results }, null, 2));

  const okCount = results.filter((r) => r.ok).length;
  console.log(`\n完成：成功 ${okCount}/${results.length}，总成本 $${totalCost.toFixed(4)}`);
  if (okCount < results.length) process.exitCode = 1;
}

main();
