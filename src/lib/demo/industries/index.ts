import type { IndustryConfig, IndustryId } from "../contracts";
import { NAILS_CONFIG } from "./nails";
import { SUSHI_CONFIG } from "./sushi";

export const INDUSTRY_CONFIGS: Record<IndustryId, IndustryConfig> = {
  nails: NAILS_CONFIG,
  sushi: SUSHI_CONFIG,
};

export function getIndustryConfig(id: string): IndustryConfig | null {
  return id === "nails" || id === "sushi" ? INDUSTRY_CONFIGS[id] : null;
}
