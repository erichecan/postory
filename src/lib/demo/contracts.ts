import { z } from "zod";

export const INDUSTRY_IDS = ["nails", "sushi"] as const;
export type IndustryId = (typeof INDUSTRY_IDS)[number];

export const OUTPUT_IDS = ["portrait-2x3", "square", "portrait-4x5"] as const;
export type OutputId = (typeof OUTPUT_IDS)[number];

export const OUTPUT_SPECS: Record<OutputId, { width: number; height: number }> = {
  "portrait-2x3": { width: 1080, height: 1620 },
  square: { width: 1080, height: 1080 },
  "portrait-4x5": { width: 1080, height: 1350 },
};

export const STEPS = ["landing", "upload", "templates", "edit", "preview", "success"] as const;
export type Step = (typeof STEPS)[number];

export type FieldValue = string | boolean | number | string[];

export const fieldValueSchema: z.ZodType<FieldValue> = z.union([
  z.string(),
  z.boolean(),
  z.number(),
  z.array(z.string()),
]);

export const fieldSpecSchema = z.object({
  id: z.string().min(1),
  semanticKey: z.string().min(1),
  kind: z.enum(["text", "textarea", "text-list", "money"]),
  labelKey: z.string().min(1),
  required: z.boolean(),
  maxLength: z.number().int().positive().optional(),
  maxItems: z.number().int().positive().optional(),
  itemMaxLength: z.number().int().positive().optional(),
  defaultValue: fieldValueSchema.optional(),
  renderTarget: z.enum(["image", "copy"]),
});
export type FieldSpec = z.infer<typeof fieldSpecSchema>;

export const outputSpecSchema = z.object({
  id: z.enum(OUTPUT_IDS),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  mime: z.literal("image/png"),
});
export type OutputSpec = z.infer<typeof outputSpecSchema>;

export const templateRefSchema = z.object({
  sourceId: z.string().min(1),
  sourceVersion: z.string().min(1),
  categoryId: z.string().min(1),
  adapterId: z.string().min(1),
});
export type TemplateRef = z.infer<typeof templateRefSchema>;

export const industryConfigSchema = z.object({
  schemaVersion: z.literal(2),
  configVersion: z.string().min(1),
  id: z.enum(INDUSTRY_IDS),
  routeBase: z.string().min(1).startsWith("/demo/"),
  defaultLocale: z.string().min(1),
  supportedLocales: z.array(z.string().min(1)).min(1),
  themeTokens: z.record(z.string(), z.string()),
  copy: z.record(z.string(), z.record(z.string(), z.string())),
  categories: z.array(z.object({ id: z.string().min(1), labelKey: z.string().min(1) })),
  templates: z.array(templateRefSchema).min(1),
  fieldCatalog: z.array(fieldSpecSchema).min(1),
  mediaPolicy: z.object({
    minCount: z.literal(1),
    maxCount: z.literal(6),
    maxFileBytes: z.number().int().positive(),
    maxBatchBytes: z.number().int().positive(),
    maxInputPixels: z.number().int().positive(),
    maxNormalizedLongEdge: z.number().int().positive(),
    acceptedMime: z.array(z.string().min(1)).min(1),
  }),
  outputs: z.array(outputSpecSchema).min(1),
  capabilities: z.object({
    anonymous: z.literal(true),
    imagePreview: z.literal(true),
    watermarkedDownload: z.literal(true),
    login: z.literal(false),
    scheduling: z.literal(false),
    publishing: z.literal(false),
  }),
  conversion: z.object({
    headlineKey: z.string().min(1),
    bodyKey: z.string().min(1),
    ctaLabelKey: z.string().min(1),
    serviceUrl: z.string().url().optional(),
    contactUrl: z.string().url().optional(),
    verifiedClaims: z.array(z.object({ textKey: z.string().min(1), evidenceRef: z.string().min(1) })),
  }),
});
export type IndustryConfig = z.infer<typeof industryConfigSchema>;

export const mediaAssetSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["processing", "ready", "failed"]),
  mime: z.string().min(1),
  width: z.number().int().nonnegative(),
  height: z.number().int().nonnegative(),
  byteSize: z.number().int().nonnegative(),
  contentHash: z.string().min(1),
  storageKey: z.string().min(1),
  createdAt: z.string().min(1),
  expiresAt: z.string().min(1),
});
export type MediaAsset = z.infer<typeof mediaAssetSchema>;

export const photoBindingSchema = z.object({
  slotId: z.string().min(1),
  assetId: z.string().min(1),
  crop: z.object({
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
    width: z.number().min(0).max(1),
    height: z.number().min(0).max(1),
  }),
});
export type PhotoBinding = z.infer<typeof photoBindingSchema>;

export const contentDraftSchema = z.object({
  templateId: z.string().min(1),
  templateVersion: z.string().min(1),
  fields: z.record(z.string(), fieldValueSchema),
  bindings: z.array(photoBindingSchema),
  outputId: z.enum(OUTPUT_IDS),
});
export type ContentDraft = z.infer<typeof contentDraftSchema>;

export const demoSessionSchema = z.object({
  schemaVersion: z.literal(2),
  id: z.string().min(1),
  industryId: z.enum(INDUSTRY_IDS),
  configVersion: z.string().min(1),
  revision: z.number().int().nonnegative(),
  locale: z.string().min(1),
  assets: z.array(mediaAssetSchema),
  assetOrder: z.array(z.string().min(1)),
  draft: contentDraftSchema.optional(),
  lastStep: z.enum(STEPS),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  expiresAt: z.string().min(1),
});
export type DemoSession = z.infer<typeof demoSessionSchema>;

export const renderArtifactSchema = z.object({
  id: z.string().min(1),
  sessionId: z.string().min(1),
  revision: z.number().int().nonnegative(),
  renderKey: z.string().min(1),
  templateId: z.string().min(1),
  templateVersion: z.string().min(1),
  outputId: z.enum(OUTPUT_IDS),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  mime: z.literal("image/png"),
  byteSize: z.number().int().nonnegative(),
  watermarkPolicyVersion: z.string().min(1),
  storageKey: z.string().min(1),
  createdAt: z.string().min(1),
  expiresAt: z.string().min(1),
});
export type RenderArtifact = z.infer<typeof renderArtifactSchema>;

export interface TemplateDescriptor {
  id: string;
  version: string;
  adapterId: string;
  industryIds: IndustryId[];
  fieldSpecs: FieldSpec[];
  photoSlots: { id: string; required: boolean; aspectRatio: number; fit: "cover" | "contain" }[];
  outputs: OutputSpec[];
  /** Keyed only by the OutputIds this template actually declares in `outputs` above — V2.0 §9.3. */
  watermarkSafeAreas: Partial<Record<OutputId, { x: number; y: number; width: number; height: number }>>;
}

export interface ValidationIssue {
  path: string;
  code: string;
  messageKey: string;
}

export function validateIndustryConfig(config: unknown): IndustryConfig {
  return industryConfigSchema.parse(config);
}

export function parseDemoSession(raw: unknown): DemoSession {
  return demoSessionSchema.parse(raw);
}

export const WATERMARK_POLICY_VERSION = "demo-v1";
