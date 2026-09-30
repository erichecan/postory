import "server-only";
import type { Quality } from "@/components/create/studio-options";
import { fakeProvider } from "./fake-provider";
import type { ImageProvider } from "./types";

export { ProviderError } from "./types";

const COST_ESTIMATE_MICROS: Record<Quality, number> = { standard: 60_000, hd: 250_000 };

export function estimateCostMicros(quality: Quality) {
  return COST_ESTIMATE_MICROS[quality];
}

export function dailyCostCapMicros() {
  const usd = Number(process.env.AI_DAILY_COST_CAP_USD ?? "50");
  return Math.round((Number.isFinite(usd) && usd >= 0 ? usd : 50) * 1_000_000);
}

export function getImageProvider(): ImageProvider {
  const name = process.env.AI_PROVIDER ?? "fake";
  if (name === "fake") return fakeProvider;
  throw new Error(`AI_PROVIDER=${name} is not wired up yet`);
}
