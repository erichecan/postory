import { type FieldSpec, type IndustryConfig, OUTPUT_SPECS, validateIndustryConfig } from "../contracts";

/**
 * Field limits updated against the actual Nails Edit mockup (粉色美甲社媒模板编辑器.png,
 * read via the Read tool, not OCR): 标题 shows "10/30" (max 30), 正文描述 shows "36/200"
 * (max 200). DEV-PLAN 歧义清单第4条裁定按设计稿实际数字配置,取代 V2.0 §4.2 的建议值
 * (title 40 / shortCopy 160) — those were a placeholder used before the mockup was read.
 * contactNote/availabilityText limits are not shown in the captured Edit-tab screenshot
 * (预约时间 tab wasn't opened), so they keep the V2.0 suggested numbers as a reasonable default.
 */
export const NAILS_FIELD_CATALOG: FieldSpec[] = [
  {
    id: "title",
    semanticKey: "title",
    kind: "text",
    labelKey: "demo.fields.title.label",
    required: true,
    maxLength: 30,
    renderTarget: "image",
  },
  {
    id: "shortCopy",
    semanticKey: "shortCopy",
    kind: "textarea",
    labelKey: "demo.fields.shortCopy.label",
    required: true,
    maxLength: 200,
    renderTarget: "copy",
  },
  {
    id: "contactNote",
    semanticKey: "contactNote",
    kind: "text",
    labelKey: "demo.fields.contactNote.label",
    required: false,
    maxLength: 80,
    renderTarget: "copy",
  },
  {
    id: "availabilityText",
    semanticKey: "availabilityText",
    kind: "text-list",
    labelKey: "demo.fields.availabilityText.label",
    required: false,
    maxItems: 4,
    itemMaxLength: 40,
    renderTarget: "copy",
  },
];

export const NAILS_CONFIG: IndustryConfig = validateIndustryConfig({
  schemaVersion: 2,
  configVersion: "2026.10.09-m1",
  id: "nails",
  routeBase: "/demo/nails",
  defaultLocale: "zh",
  supportedLocales: ["zh", "en"],
  themeTokens: {
    "--demo-bg": "#fdf2f6",
    "--demo-surface": "#ffffff",
    "--demo-primary": "#e8769c",
    "--demo-primary-ink": "#ffffff",
    "--demo-ink": "#2a1b22",
    "--demo-muted": "#8a6b74",
  },
  copy: {
    zh: {
      "demo.fields.title.label": "标题",
      "demo.fields.shortCopy.label": "短文案",
      "demo.fields.contactNote.label": "联系说明",
      "demo.fields.availabilityText.label": "档期宣传文字",
    },
    en: {
      "demo.fields.title.label": "Title",
      "demo.fields.shortCopy.label": "Caption",
      "demo.fields.contactNote.label": "Contact note",
      "demo.fields.availabilityText.label": "Availability highlights",
    },
  },
  categories: [{ id: "works", labelKey: "demo.category.works" }],
  templates: [{ sourceId: "nails-demo-classic", sourceVersion: "1", categoryId: "works", adapterId: "demo-static-adapter" }],
  fieldCatalog: NAILS_FIELD_CATALOG,
  mediaPolicy: {
    minCount: 1,
    maxCount: 6,
    maxFileBytes: 15 * 1024 * 1024,
    maxBatchBytes: 60 * 1024 * 1024,
    maxInputPixels: 40_000_000,
    maxNormalizedLongEdge: 2560,
    acceptedMime: ["image/jpeg", "image/png", "image/webp"],
  },
  outputs: [
    { id: "portrait-2x3", ...OUTPUT_SPECS["portrait-2x3"], mime: "image/png" },
  ],
  capabilities: {
    anonymous: true,
    imagePreview: true,
    watermarkedDownload: true,
    login: false,
    scheduling: false,
    publishing: false,
  },
  conversion: {
    headlineKey: "demo.conversion.headline",
    bodyKey: "demo.conversion.body",
    ctaLabelKey: "demo.conversion.cta",
    verifiedClaims: [],
  },
});
