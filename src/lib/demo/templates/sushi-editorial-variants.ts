import { z } from "zod";
import { OUTPUT_SPECS, TEMPLATE_RATIO_IDS } from "../contracts";

const rect = z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1), width: z.number().positive().max(1), height: z.number().positive().max(1) });
const ratioLayout = z.object({
  width: z.number().int().positive(), height: z.number().int().positive(),
  focalPoint: z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) }),
  overlay: z.string().min(1),
  eyebrow: rect, headline: rect, tagline: rect, availability: rect, safeArea: rect,
  headlineSize: z.number().positive(), taglineSize: z.number().positive(),
});
const definitionSchema = z.object({
  id: z.string().min(1), version: z.string().min(1), industryId: z.literal("sushi"), categoryId: z.string().min(1),
  family: z.literal("sushi-editorial"), variant: z.enum(["lunch", "new-menu", "party", "restaurant", "authentic"]),
  eyebrow: z.string().min(1), headlineDefault: z.string().min(1), taglineDefault: z.string(),
  slots: z.array(z.object({ id: z.string(), type: z.enum(["image", "text"]), required: z.boolean(), fieldId: z.string().optional(), maxLength: z.number().int().positive().optional() })).min(3),
  layouts: z.record(z.enum(TEMPLATE_RATIO_IDS), ratioLayout),
});

function layout(
  ratio: "square" | "portrait-4x5" | "story-9x16",
  variant: "lunch" | "new-menu" | "party" | "restaurant" | "authentic",
) {
  const size = OUTPUT_SPECS[ratio];
  const presets = {
    square: {
      lunch: { focalPoint: { x: .55, y: .63 }, overlay: "linear-gradient(180deg,rgba(12,8,5,.78) 0%,rgba(12,8,5,.18) 52%,rgba(12,8,5,.08) 100%)", eyebrow: {x:.07,y:.07,width:.68,height:.07}, headline:{x:.07,y:.15,width:.8,height:.25}, tagline:{x:.07,y:.45,width:.72,height:.18}, headlineSize:10.2, taglineSize:4.1 },
      "new-menu": { focalPoint: { x: .66, y: .57 }, overlay: "linear-gradient(90deg,rgba(249,235,211,.99) 0%,rgba(249,235,211,.96) 43%,rgba(249,235,211,.48) 61%,transparent 78%)", eyebrow: {x:.07,y:.08,width:.42,height:.07}, headline:{x:.07,y:.17,width:.49,height:.31}, tagline:{x:.09,y:.57,width:.39,height:.18}, headlineSize:10, taglineSize:3.8 },
      party: { focalPoint: { x: .68, y: .58 }, overlay: "linear-gradient(90deg,rgba(20,16,13,.97) 0%,rgba(20,16,13,.88) 41%,rgba(20,16,13,.22) 64%,transparent 100%)", eyebrow: {x:.07,y:.08,width:.38,height:.07}, headline:{x:.07,y:.18,width:.46,height:.28}, tagline:{x:.075,y:.53,width:.42,height:.24}, headlineSize:9.2, taglineSize:3.5 },
      restaurant: { focalPoint: { x: .62, y: .52 }, overlay: "linear-gradient(90deg,rgba(28,19,12,.9) 0%,rgba(28,19,12,.58) 48%,rgba(28,19,12,.08) 100%)", eyebrow: {x:.07,y:.1,width:.68,height:.07}, headline:{x:.07,y:.22,width:.72,height:.28}, tagline:{x:.075,y:.58,width:.66,height:.16}, headlineSize:9.5, taglineSize:3.8 },
      authentic: { focalPoint: { x: .62, y: .56 }, overlay: "linear-gradient(0deg,rgba(14,10,7,.82) 0%,rgba(14,10,7,.4) 42%,transparent 77%)", eyebrow: {x:.07,y:.62,width:.74,height:.06}, headline:{x:.07,y:.68,width:.84,height:.24}, tagline:{x:.075,y:.9,width:.78,height:.08}, headlineSize:9.7, taglineSize:3.2 },
    },
    "portrait-4x5": {
      lunch: { focalPoint: { x: .55, y: .62 }, overlay: "linear-gradient(180deg,rgba(12,8,5,.78) 0%,rgba(12,8,5,.18) 52%,rgba(12,8,5,.08) 100%)", eyebrow: {x:.07,y:.08,width:.7,height:.06}, headline:{x:.07,y:.16,width:.82,height:.22}, tagline:{x:.07,y:.41,width:.73,height:.15}, headlineSize:10.5, taglineSize:4.2 },
      "new-menu": { focalPoint: { x: .67, y: .58 }, overlay: "linear-gradient(90deg,rgba(249,235,211,.99) 0%,rgba(249,235,211,.96) 42%,rgba(249,235,211,.4) 62%,transparent 82%)", eyebrow: {x:.07,y:.1,width:.43,height:.06}, headline:{x:.07,y:.18,width:.49,height:.28}, tagline:{x:.09,y:.52,width:.4,height:.15}, headlineSize:10.6, taglineSize:3.9 },
      party: { focalPoint: { x: .69, y: .58 }, overlay: "linear-gradient(90deg,rgba(20,16,13,.97) 0%,rgba(20,16,13,.88) 41%,rgba(20,16,13,.22) 64%,transparent 100%)", eyebrow: {x:.07,y:.1,width:.4,height:.06}, headline:{x:.07,y:.2,width:.46,height:.24}, tagline:{x:.075,y:.49,width:.42,height:.19}, headlineSize:9.6, taglineSize:3.6 },
      restaurant: { focalPoint: { x: .62, y: .52 }, overlay: "linear-gradient(90deg,rgba(28,19,12,.9) 0%,rgba(28,19,12,.58) 48%,rgba(28,19,12,.08) 100%)", eyebrow: {x:.07,y:.12,width:.68,height:.06}, headline:{x:.07,y:.24,width:.74,height:.24}, tagline:{x:.075,y:.55,width:.66,height:.15}, headlineSize:9.8, taglineSize:3.9 },
      authentic: { focalPoint: { x: .62, y: .56 }, overlay: "linear-gradient(0deg,rgba(14,10,7,.84) 0%,rgba(14,10,7,.42) 42%,transparent 77%)", eyebrow: {x:.07,y:.65,width:.74,height:.05}, headline:{x:.07,y:.7,width:.84,height:.2}, tagline:{x:.075,y:.9,width:.78,height:.07}, headlineSize:10.3, taglineSize:3.3 },
    },
    "story-9x16": {
      lunch: { focalPoint: { x: .56, y: .6 }, overlay: "linear-gradient(180deg,rgba(12,8,5,.76) 0%,rgba(12,8,5,.22) 40%,rgba(12,8,5,.12) 100%)", eyebrow: {x:.07,y:.14,width:.76,height:.045}, headline:{x:.07,y:.2,width:.84,height:.16}, tagline:{x:.07,y:.39,width:.78,height:.12}, headlineSize:10.8, taglineSize:4.2 },
      "new-menu": { focalPoint: { x: .64, y: .56 }, overlay: "linear-gradient(180deg,rgba(249,235,211,.97) 0%,rgba(249,235,211,.83) 33%,rgba(249,235,211,.12) 55%,transparent 68%)", eyebrow: {x:.07,y:.1,width:.64,height:.05}, headline:{x:.07,y:.16,width:.78,height:.16}, tagline:{x:.09,y:.34,width:.75,height:.12}, headlineSize:11, taglineSize:4 },
      party: { focalPoint: { x: .68, y: .6 }, overlay: "linear-gradient(180deg,rgba(20,16,13,.92) 0%,rgba(20,16,13,.65) 40%,rgba(20,16,13,.12) 73%,transparent 100%)", eyebrow: {x:.07,y:.13,width:.8,height:.05}, headline:{x:.07,y:.2,width:.82,height:.16}, tagline:{x:.075,y:.39,width:.8,height:.13}, headlineSize:10.8, taglineSize:4 },
      restaurant: { focalPoint: { x: .62, y: .52 }, overlay: "linear-gradient(180deg,rgba(28,19,12,.82) 0%,rgba(28,19,12,.45) 38%,transparent 72%)", eyebrow: {x:.07,y:.13,width:.76,height:.05}, headline:{x:.07,y:.2,width:.84,height:.16}, tagline:{x:.075,y:.39,width:.8,height:.12}, headlineSize:10.8, taglineSize:4 },
      authentic: { focalPoint: { x: .62, y: .56 }, overlay: "linear-gradient(0deg,rgba(14,10,7,.87) 0%,rgba(14,10,7,.38) 38%,transparent 72%)", eyebrow: {x:.07,y:.68,width:.8,height:.04}, headline:{x:.07,y:.73,width:.86,height:.15}, tagline:{x:.075,y:.9,width:.8,height:.06}, headlineSize:10.8, taglineSize:3.5 },
    },
  } as const;
  const chosen = presets[ratio][variant];
  const availability = variant === "authentic"
    ? { x: .07, y: ratio === "story-9x16" ? .08 : .07, width: .62, height: .14 }
    : { x: .07, y: ratio === "story-9x16" ? .79 : .8, width: .62, height: .14 };
  return {
    width: size.width, height: size.height, focalPoint: chosen.focalPoint, overlay: chosen.overlay,
    eyebrow: chosen.eyebrow, headline: chosen.headline, tagline: chosen.tagline,
    availability,
    headlineSize: chosen.headlineSize, taglineSize: chosen.taglineSize,
    safeArea: { x: .68, y: ratio === "story-9x16" ? .76 : .87, width: .27, height: .08 },
  };
}

const rows = [
  { id: "sushi-lunch-special-01", categoryId: "lunch", variant: "lunch", eyebrow: "LUNCH SPECIAL", headlineDefault: "Lunch\nSpecial", taglineDefault: "Fresh sushi for your midday break." },
  { id: "sushi-new-menu-01", categoryId: "new-menu", variant: "new-menu", eyebrow: "JUST ARRIVED", headlineDefault: "New\nMenu", taglineDefault: "Discover the latest sushi creations." },
  { id: "sushi-party-platter-01", categoryId: "party", variant: "party", eyebrow: "MADE TO SHARE", headlineDefault: "Party\nPlatters", taglineDefault: "Birthdays · Office events · Family dinners" },
  { id: "sushi-dine-with-us-01", categoryId: "restaurant", variant: "restaurant", eyebrow: "GOOD FOOD · GOOD COMPANY", headlineDefault: "Dine\nWith Us", taglineDefault: "A welcoming place for sushi and good company." },
  { id: "sushi-authentic-japanese-01", categoryId: "signature", variant: "authentic", eyebrow: "JAPANESE CUISINE", headlineDefault: "Authentic\nJapanese\nSushi", taglineDefault: "Fresh sushi, made with care." },
] as const;

export const SUSHI_EDITORIAL_VARIANTS = Object.fromEntries(rows.map((row) => [row.id, definitionSchema.parse({
  ...row,
  version: "1.0.0",
  industryId: "sushi",
  family: "sushi-editorial",
  slots: [
    { id: "hero", type: "image", required: true },
    { id: "headline", type: "text", required: true, fieldId: "title", maxLength: 32 },
    { id: "tagline", type: "text", required: false, fieldId: "shortCopy", maxLength: 72 },
    { id: "availability", type: "text", required: false, fieldId: "availabilityText", maxLength: 80 },
  ],
  layouts: Object.fromEntries(TEMPLATE_RATIO_IDS.map((ratio) => [ratio, layout(ratio, row.variant)])),
})])) as Record<(typeof rows)[number]["id"], z.infer<typeof definitionSchema>>;

export type SushiEditorialVariantId = keyof typeof SUSHI_EDITORIAL_VARIANTS;
export const SUSHI_TEMPLATE_IDS = ["sushi-signature-editorial-01", ...Object.keys(SUSHI_EDITORIAL_VARIANTS)] as const;
export const SUSHI_TEMPLATE_VERSIONS = Object.fromEntries(SUSHI_TEMPLATE_IDS.map((id) => [id, "1.0.0"])) as Record<(typeof SUSHI_TEMPLATE_IDS)[number], string>;
