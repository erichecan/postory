import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "./client";

// 周几关键词 -> JS Date.getDay()（0=周日）。没提到具体日期时默认"明天"。
const WEEKDAY_KEYWORDS: Record<string, number> = {
  周日: 0, 星期日: 0, 周天: 0,
  周一: 1, 星期一: 1,
  周二: 2, 星期二: 2,
  周三: 3, 星期三: 3,
  周四: 4, 星期四: 4,
  周五: 5, 星期五: 5,
  周六: 6, 星期六: 6,
};

function resolveTargetDate(text: string): Date {
  const today = new Date();
  const todayUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  if (text.includes("今天")) return todayUtc;
  for (const [kw, weekday] of Object.entries(WEEKDAY_KEYWORDS)) {
    if (text.includes(kw)) {
      let delta = (weekday - todayUtc.getUTCDay() + 7) % 7;
      if (delta === 0) delta = 7; // "周二" 说的是下一个周二，不是今天（今天是周二的话会用"今天"）
      return new Date(todayUtc.getTime() + delta * 86400000);
    }
  }
  return new Date(todayUtc.getTime() + 86400000); // 默认明天
}

type Candidate = { id: string; nameZh: string; captionAngle: string };

function ruleBasedPick(text: string, candidates: Candidate[]): string | null {
  let best: { id: string; score: number } | null = null;
  for (const c of candidates) {
    const haystack = `${c.nameZh}${c.captionAngle}`;
    let score = 0;
    for (const ch of text) if (haystack.includes(ch)) score++;
    if (!best || score > best.score) best = { id: c.id, score };
  }
  return best && best.score > 0 ? best.id : (candidates[0]?.id ?? null);
}

async function aiPick(text: string, candidates: Candidate[]): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || candidates.length === 0) return null;
  try {
    const client = new Anthropic({ apiKey });
    // Haiku 4.5：这是个轻量分类匹配任务（从候选列表里选一个id），不是复杂推理，
    // 用 Opus 级别模型对这种量大、低风险的调用来说是浪费。
    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 256,
      tool_choice: { type: "tool", name: "pick_campaign" },
      tools: [
        {
          name: "pick_campaign",
          description: "从候选活动列表里选出和商家这句话意图最匹配的一个",
          input_schema: {
            type: "object",
            properties: { campaignTemplateId: { type: "string", enum: candidates.map((c) => c.id) } },
            required: ["campaignTemplateId"],
          },
        },
      ],
      messages: [
        {
          role: "user",
          content: `商家说："${text}"\n\n候选活动：\n${candidates.map((c) => `- ${c.id}: ${c.nameZh}（${c.captionAngle}）`).join("\n")}\n\n选出最匹配的一个。`,
        },
      ],
    });
    const toolUse = response.content.find((b) => b.type === "tool_use");
    if (toolUse && toolUse.type === "tool_use") {
      const input = toolUse.input as { campaignTemplateId?: string };
      if (input.campaignTemplateId && candidates.some((c) => c.id === input.campaignTemplateId)) return input.campaignTemplateId;
    }
    return null;
  } catch {
    return null; // AI 调用失败就降级到规则兜底，不让这一步变成硬失败
  }
}

export type NlOrderResult = { ok: true; date: string; campaignTemplateId: string | null; usedAi: boolean } | { ok: false; reason: "missing_profile" };

export async function naturalLanguageOrder(userId: string, text: string): Promise<NlOrderResult> {
  const profile = await prisma.brandProfile.findUnique({ where: { userId }, select: { industry: true } });
  if (!profile?.industry || profile.industry === "OTHER") return { ok: false, reason: "missing_profile" };

  const candidates = await prisma.campaignTemplate.findMany({
    where: { industry: profile.industry },
    select: { id: true, nameZh: true, captionAngle: true },
  });

  const aiPicked = await aiPick(text, candidates);
  const campaignTemplateId = aiPicked ?? ruleBasedPick(text, candidates);
  const date = resolveTargetDate(text);

  await prisma.calendarSlot.upsert({
    where: { userId_date: { userId, date } },
    create: { userId, date, campaignTemplateId, status: "SUGGESTED" },
    update: { campaignTemplateId, status: "SUGGESTED" },
  });

  return { ok: true, date: date.toISOString().slice(0, 10), campaignTemplateId, usedAi: !!aiPicked };
}
