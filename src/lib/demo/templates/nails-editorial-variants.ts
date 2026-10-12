import { layeredTemplateSchema, OUTPUT_SPECS, TEMPLATE_RATIO_IDS, type TemplateDescriptor, type TemplateRatioId } from "../contracts";
import { NAILS_FIELD_CATALOG } from "../industries/nails";
import type { LayeredTemplateDefinition } from "../contracts";

type Rect = { x: number; y: number; width: number; height: number };
type Point = { x: number; y: number };
type RatioLayout = {
  focalPoint: Point; gradient: string; headline: Rect; tagline: Rect;
  ornamentTop: Rect; ornamentBottom: Rect; accentBrush: Rect;
  titleColor: string; copyColor: string; titleFont: string; copyFont: string;
  titleSize: number; copySize: number;
  appointment: Rect;
};

const frame = (ratio: TemplateRatioId, colors: {
  overlay: string; focal?: Point; title: string; copy: string; titleFont?: string;
  titleSize?: number; copySize?: number;
  headline?: Rect; tagline?: Rect;
  ornamentTop?: Rect; ornamentBottom?: Rect; accentBrush?: Rect;
}): RatioLayout => {
  const composition = {
    square: { headline: { x: .07, y: .13, width: .72, height: .25 }, tagline: { x: .08, y: .42, width: .73, height: .12 }, top: { x: .77, y: .06, width: .18, height: .18 }, bottom: { x: .03, y: .76, width: .2, height: .17 }, brush: { x: .08, y: .59, width: .28, height: .045 } },
    "portrait-4x5": { headline: { x: .07, y: .11, width: .7, height: .24 }, tagline: { x: .08, y: .39, width: .72, height: .12 }, top: { x: .77, y: .055, width: .19, height: .19 }, bottom: { x: .025, y: .73, width: .21, height: .18 }, brush: { x: .08, y: .55, width: .3, height: .045 } },
    "story-9x16": { headline: { x: .07, y: .14, width: .83, height: .16 }, tagline: { x: .075, y: .33, width: .81, height: .095 }, top: { x: .77, y: .07, width: .18, height: .13 }, bottom: { x: .025, y: .79, width: .22, height: .13 }, brush: { x: .08, y: .465, width: .3, height: .035 } },
  }[ratio];
  return {
    focalPoint: colors.focal ?? { x: .69, y: .62 },
    gradient: colors.overlay,
    headline: colors.headline ?? composition.headline,
    tagline: colors.tagline ?? composition.tagline,
    ornamentTop: colors.ornamentTop ?? composition.top,
    ornamentBottom: colors.ornamentBottom ?? composition.bottom,
    accentBrush: colors.accentBrush ?? composition.brush,
    appointment: ratio === "story-9x16" ? { x: .29, y: .79, width: .38, height: .15 } : { x: .29, y: .78, width: .36, height: .14 },
    titleColor: colors.title,
    copyColor: colors.copy,
    titleFont: colors.titleFont ?? 'Georgia, "Noto Serif SC", "Songti SC", serif',
    copyFont: 'Arial, "Noto Sans SC", "PingFang SC", sans-serif',
    titleSize: colors.titleSize ?? (ratio === "story-9x16" ? 10.6 : ratio === "portrait-4x5" ? 10.8 : 9.5),
    copySize: colors.copySize ?? 4,
  };
};

const ratios = (make: (ratio: TemplateRatioId) => RatioLayout) => Object.fromEntries(TEMPLATE_RATIO_IDS.map((ratio) => {
  const item = make(ratio);
  const size = OUTPUT_SPECS[ratio];
  return [ratio, {
    width: size.width, height: size.height,
    photo: { x: 0, y: 0, width: 1, height: 1 },
    focalPoint: item.focalPoint,
    overlay: { x: 0, y: 0, width: 1, height: 1, gradient: item.gradient },
    headline: { ...item.headline, fontSizeCqw: item.titleSize, lineHeight: .97, maxLines: 2, fontFamily: item.titleFont, color: item.titleColor },
    tagline: { ...item.tagline, fontSizeCqw: item.copySize, lineHeight: 1.35, maxLines: 3, fontFamily: item.copyFont, color: item.copyColor },
    appointment: { ...item.appointment, fontSizeCqw: ratio === "story-9x16" ? 1.9 : 2.05, lineHeight: 1.45, maxLines: 3, fontFamily: 'Arial, "Noto Sans SC", sans-serif', color: item.copyColor },
    ornamentTop: item.ornamentTop,
    ornamentBottom: item.ornamentBottom,
    accentBrush: item.accentBrush,
    watermarkSafeArea: { x: .68, y: ratio === "story-9x16" ? .84 : .87, width: .27, height: .08 },
  }];
})) as Record<TemplateRatioId, unknown>;

const defs = [
  {
    id: "nails-glazed-pearl-01", title: "裸透珍珠\n日常上新", tagline: "温柔显白，轻盈有光", sample: "hero-glazed-pearl-sample.webp", folder: "glazed-pearl",
    overlay: "linear-gradient(112deg,rgba(250,242,234,.94) 0%,rgba(250,242,234,.78) 43%,rgba(250,242,234,.1) 75%,transparent 100%)", titleColor: "#69493F", copyColor: "#745B51", titleFont: 'Georgia, "Noto Serif SC", "Songti SC", serif',
  },
  {
    id: "nails-french-terracotta-01", title: "法式新意\n指尖上新", tagline: "经典线条，温柔焕新", sample: "hero-french-terracotta-sample.webp", folder: "french-terracotta",
    overlay: "linear-gradient(108deg,rgba(249,240,224,.96) 0%,rgba(249,240,224,.86) 46%,rgba(249,240,224,.1) 76%,transparent 100%)", titleColor: "#79351F", copyColor: "#754C3C", titleFont: 'Georgia, "Noto Serif SC", "Songti SC", serif',
  },
  {
    id: "nails-berry-velvet-01", title: "莓果酒红\n节日限定", tagline: "深色显白 · 预约开启", sample: "hero-berry-velvet-sample.webp", folder: "berry-velvet",
    overlay: "linear-gradient(105deg,rgba(37,5,17,.82) 0%,rgba(40,6,20,.64) 47%,rgba(40,6,20,.05) 82%)", titleColor: "#FFF1DD", copyColor: "#F3D7B3",
  },
  {
    id: "nails-winter-berry-01", title: "冬日莓红\n节日新款", tagline: "温暖一整个冬天", sample: "hero-winter-berry-sample.webp", folder: "winter-berry",
    overlay: "linear-gradient(105deg,rgba(255,248,244,.94) 0%,rgba(255,248,244,.82) 43%,rgba(255,248,244,.06) 77%,transparent 100%)", titleColor: "#8C1826", copyColor: "#743D45",
  },
  {
    id: "nails-copper-autumn-offer-01", title: "秋日焕新\n美甲礼遇", tagline: "限时预约 · 为指尖加点光", sample: "hero-copper-autumn-offer-sample.webp", folder: "copper-autumn-offer",
    overlay: "linear-gradient(108deg,rgba(29,16,10,.9) 0%,rgba(35,17,10,.75) 46%,rgba(35,17,10,.06) 82%)", titleColor: "#FFF0D8", copyColor: "#F2C587",
  },
] as const;

export type NailsEditorialVariantId = (typeof defs)[number]["id"];

export const NAILS_EDITORIAL_VARIANTS = Object.fromEntries(defs.map((item) => {
  const layouts = ratios((ratio) => frame(ratio, {
    overlay: item.overlay, title: item.titleColor, copy: item.copyColor, titleFont: "titleFont" in item ? item.titleFont : undefined,
  }));
  return [item.id, layeredTemplateSchema.parse({
    schemaVersion: 1,
    id: item.id,
    version: "1.0.0",
    industryId: "nails",
    categoryId: "works",
    family: "full-bleed-editorial",
    slots: [
      { id: "hero", type: "image", required: true, fit: "cover", defaultFocalPoint: { x: .69, y: .62 } },
      { id: "headline", type: "text", fieldId: "title", required: true, maxLength: 30, maxLines: 2, defaultValue: item.title, transform: "none" },
      { id: "tagline", type: "text", fieldId: "shortCopy", required: false, maxLength: 200, maxLines: 3, defaultValue: item.tagline, transform: "none" },
      { id: "availability", type: "text", fieldId: "availabilityText", required: false, maxLength: 80, maxLines: 1, defaultValue: "", transform: "none" },
    ],
    decorationAssets: {
      ornamentTop: `/demo/templates/nails/assets/${item.folder}-upper.svg`,
      ornamentBottom: `/demo/templates/nails/assets/${item.folder}-lower.svg`,
      accentBrush: `/demo/templates/nails/assets/${item.folder}-accent.svg`,
    },
    selectionBadge: "outside-renderer",
    layouts,
  })];
})) as Record<NailsEditorialVariantId, LayeredTemplateDefinition>;

export const NAILS_EDITORIAL_VARIANT_IDS = defs.map(({ id }) => id);
export const NAILS_TEMPLATE_IDS = [
  "nails-glazed-pearl-01",
  "nails-french-terracotta-01",
  "nails-autumn-cat-eye-01",
  "nails-berry-velvet-01",
  "nails-winter-berry-01",
  "nails-copper-autumn-offer-01",
] as const;
export const NAILS_TEMPLATE_DEFAULTS = {
  ...Object.fromEntries(defs.map((item) => [item.id, { title: item.title, shortCopy: item.tagline, sample: `/demo/templates/nails/assets/${item.sample}` }])),
  "nails-autumn-cat-eye-01": { title: "秋日猫眼\n新品上线", shortCopy: "一抹流光，点亮秋日", sample: "/demo/templates/nails/assets/hero-autumn-cat-eye-sample.png" },
} as Record<(typeof NAILS_TEMPLATE_IDS)[number], { title: string; shortCopy: string; sample: string }>;

export const NAILS_EDITORIAL_DESCRIPTORS: Record<string, TemplateDescriptor> = Object.fromEntries(Object.values(NAILS_EDITORIAL_VARIANTS).map((definition) => [definition.id, {
  id: definition.id,
  version: definition.version,
  adapterId: "react-layered-template",
  industryIds: ["nails"],
  fieldSpecs: NAILS_FIELD_CATALOG.filter((field) => field.id === "title" || field.id === "shortCopy" || field.id === "availabilityText"),
  photoSlots: [{ id: "hero", required: true, aspectRatio: 4 / 5, fit: "cover" as const }],
  outputs: TEMPLATE_RATIO_IDS.map((id) => ({ id, ...OUTPUT_SPECS[id], mime: "image/png" as const })),
  watermarkSafeAreas: Object.fromEntries(Object.entries(definition.layouts).map(([id, layout]) => [id, layout.watermarkSafeArea])),
}])) as Record<string, TemplateDescriptor>;
