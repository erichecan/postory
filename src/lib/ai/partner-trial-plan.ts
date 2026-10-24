import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type { Country, Industry } from "@/generated/prisma/client";

const planSchema = z.object({
  items: z.array(z.object({
    day: z.number().int().min(1).max(30),
    theme: z.string().min(1).max(128),
    platform: z.string().min(1).max(32),
    note: z.string().min(1).max(1000),
  })).length(30),
});

export type GeneratedPartnerPlan = z.infer<typeof planSchema>;

export async function generatePartnerTrialPlan(input: {
  brand: string;
  industry: Industry;
  country: Country;
  marketArea: string;
  productOrService: string;
  targetAudience: string | null;
  highlightNotes: string | null;
  platforms: string[];
  languagePreference: string;
}): Promise<GeneratedPartnerPlan | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const platforms = input.platforms.length ? input.platforms : ["Instagram"];
  const client = new Anthropic({ apiKey, timeout: 45_000, maxRetries: 1 });
  const response = await client.messages.create({
    model: process.env.ANTHROPIC_TEXT_MODEL || "claude-haiku-4-5-20251001",
    max_tokens: 6000,
    tool_choice: { type: "tool", name: "create_30_day_plan" },
    tools: [{
      name: "create_30_day_plan",
      description: "Create a practical 30-day social content calendar using only the supplied business facts.",
      input_schema: {
        type: "object",
        properties: {
          items: {
            type: "array",
            minItems: 30,
            maxItems: 30,
            items: {
              type: "object",
              properties: {
                day: { type: "integer", minimum: 1, maximum: 30 },
                theme: { type: "string" },
                platform: { type: "string", enum: platforms },
                note: { type: "string" },
              },
              required: ["day", "theme", "platform", "note"],
            },
          },
        },
        required: ["items"],
      },
    }],
    messages: [{
      role: "user",
      content: [
        `Create one useful content plan entry for each day, day 1 through day 30. Write in ${input.languagePreference}.`,
        "Use the requested platforms across the month. Keep themes varied and realistic for a small local business.",
        "Do not invent prices, discounts, opening hours, locations, testimonials, credentials, product ingredients, or business claims.",
        "When a detail is unknown, suggest a content angle that the business can verify or provide, and say so briefly in the note.",
        `Brand: ${input.brand}`,
        `Industry: ${input.industry}`,
        `Country/market: ${input.country}`,
        `City or service area: ${input.marketArea}`,
        `Products/services: ${input.productOrService}`,
        `Target audience: ${input.targetAudience || "Not supplied"}`,
        `Marketing highlights: ${input.highlightNotes || "Not supplied"}`,
        `Platforms: ${platforms.join(", ")}`,
      ].join("\n"),
    }],
  });

  const toolUse = response.content.find((block) => block.type === "tool_use" && block.name === "create_30_day_plan");
  if (!toolUse || toolUse.type !== "tool_use") return null;
  const parsed = planSchema.safeParse(toolUse.input);
  if (!parsed.success) return null;
  const days = new Set(parsed.data.items.map((item) => item.day));
  if (days.size !== 30) return null;
  return parsed.data;
}
