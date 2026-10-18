import "server-only";
import type { getTrialRequestByToken } from "@/lib/db/partner-trials";

export type PartnerTrialDetail = NonNullable<Awaited<ReturnType<typeof getTrialRequestByToken>>>;

export type PlatformVariant = { platform: string; exportedUrl: string };

export function parsePlatformVariants(json: unknown): PlatformVariant[] {
  if (!Array.isArray(json)) return [];
  return json.filter(
    (v): v is PlatformVariant =>
      typeof v === "object" && v !== null && typeof (v as Record<string, unknown>).platform === "string" && typeof (v as Record<string, unknown>).exportedUrl === "string",
  );
}

export type MissingField = "targetAudience" | "highlightNotes" | "websiteUrl" | "references";

export function missingTrialFields(trial: PartnerTrialDetail): MissingField[] {
  const missing: MissingField[] = [];
  if (!trial.targetAudience) missing.push("targetAudience");
  if (!trial.highlightNotes) missing.push("highlightNotes");
  if (!trial.websiteUrl) missing.push("websiteUrl");
  if (trial.references.length === 0) missing.push("references");
  return missing;
}
