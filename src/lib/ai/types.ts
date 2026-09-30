import type { Quality, RatioId } from "@/components/create/studio-options";
import type { StoredObject } from "@/lib/storage";

export type GenerateInput = { prompt: string; ratio: RatioId; quality: Quality; input: StoredObject | null };
export type GenerateOutput = { bytes: Buffer; mime: string; costMicros: number };

export class ProviderError extends Error {
  constructor(
    public code: "rejected" | "failed",
    message: string,
  ) {
    super(message);
  }
}

export type ImageProvider = { name: string; generate(input: GenerateInput): Promise<GenerateOutput> };
