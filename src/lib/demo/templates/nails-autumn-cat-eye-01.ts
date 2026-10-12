import { layeredTemplateSchema, OUTPUT_SPECS, type TemplateDescriptor } from "../contracts";
import { NAILS_FIELD_CATALOG } from "../industries/nails";

const rect = (x: number, y: number, width: number, height: number) => ({ x, y, width, height });
const point = (x: number, y: number) => ({ x, y });

export const NAILS_AUTUMN_CAT_EYE_ID = "nails-autumn-cat-eye-01";
export const NAILS_AUTUMN_CAT_EYE_VERSION = "1.0.2";

export const NAILS_AUTUMN_CAT_EYE_01 = layeredTemplateSchema.parse({
  schemaVersion: 1,
  id: NAILS_AUTUMN_CAT_EYE_ID,
  version: NAILS_AUTUMN_CAT_EYE_VERSION,
  industryId: "nails",
  categoryId: "works",
  family: "full-bleed-editorial",
  slots: [
    { id: "hero", type: "image", required: true, fit: "cover", defaultFocalPoint: point(0.68, 0.6) },
    { id: "headline", type: "text", fieldId: "title", required: true, maxLength: 30, maxLines: 2, defaultValue: "秋日猫眼\n新品上线", transform: "none" },
    { id: "tagline", type: "text", fieldId: "shortCopy", required: false, maxLength: 200, maxLines: 3, defaultValue: "一抹流光，点亮秋日", transform: "none" },
    { id: "availability", type: "text", fieldId: "availabilityText", required: false, maxLength: 80, maxLines: 1, defaultValue: "", transform: "none" },
  ],
  decorationAssets: {
    ornamentTop: "/demo/templates/nails/assets/autumn-leaf-upper.svg",
    ornamentBottom: "/demo/templates/nails/assets/autumn-leaf-lower.svg",
    accentBrush: "/demo/templates/nails/assets/accent-brush.svg",
  },
  selectionBadge: "outside-renderer",
  layouts: {
    square: {
      width: OUTPUT_SPECS.square.width,
      height: OUTPUT_SPECS.square.height,
      photo: rect(0, 0, 1, 1),
      focalPoint: point(0.7, 0.6),
      overlay: { x: 0, y: 0, width: 1, height: 1, gradient: "linear-gradient(104deg, rgba(26,10,16,.76) 0%, rgba(35,13,17,.5) 46%, rgba(35,13,17,.08) 77%, rgba(35,13,17,0) 88%)" },
      atmosphereOverlay: { gradient: "radial-gradient(ellipse at 73% 17%, rgba(232,165,82,.18), transparent 33%), linear-gradient(180deg, transparent 55%, rgba(12,7,8,.3) 100%)", blendMode: "screen" },
      editorialEyebrow: { ...rect(0.075, 0.085, 0.62, 0.035), text: "AUTUMN ／ COLOR STORY 01", fontSizeCqw: 1.75, fontFamily: 'Arial, "Noto Sans SC", sans-serif', letterSpacing: ".22em", color: "#E5BD7A" },
      editorialRule: { ...rect(0.075, 0.127, 0.28, 0.002), color: "#E7BE78" },
      headline: { ...rect(0.06, 0.14, 0.76, 0.28), fontSizeCqw: 10.2, lineHeight: 0.93, maxLines: 2, fontFamily: 'Georgia, "Noto Serif SC", "Songti SC", serif', color: "#F3DEBC" },
      tagline: { ...rect(0.07, 0.37, 0.74, 0.09), fontSizeCqw: 4.1, lineHeight: 1.35, maxLines: 3, fontFamily: 'Arial, "Noto Sans SC", "PingFang SC", sans-serif', color: "#FFF4E4" },
      appointment: { ...rect(0.29, 0.78, 0.36, 0.14), fontSizeCqw: 2.05, lineHeight: 1.45, maxLines: 3, fontFamily: 'Arial, "Noto Sans SC", sans-serif', color: "#FFF4E4" },
      ornamentTop: rect(0.73, 0.005, 0.265, 0.3),
      ornamentBottom: rect(0.005, 0.61, 0.25, 0.26),
      accentBrush: rect(0.075, 0.44, 0.33, 0.06),
      watermarkSafeArea: rect(0.68, 0.86, 0.27, 0.1),
    },
    "portrait-4x5": {
      width: OUTPUT_SPECS["portrait-4x5"].width,
      height: OUTPUT_SPECS["portrait-4x5"].height,
      photo: rect(0, 0, 1, 1),
      focalPoint: point(0.68, 0.6),
      overlay: { x: 0, y: 0, width: 1, height: 1, gradient: "linear-gradient(104deg, rgba(26,10,16,.76) 0%, rgba(35,13,17,.5) 46%, rgba(35,13,17,.08) 77%, rgba(35,13,17,0) 88%)" },
      atmosphereOverlay: { gradient: "radial-gradient(ellipse at 73% 17%, rgba(232,165,82,.18), transparent 33%), linear-gradient(180deg, transparent 55%, rgba(12,7,8,.3) 100%)", blendMode: "screen" },
      editorialEyebrow: { ...rect(0.075, 0.045, 0.62, 0.035), text: "AUTUMN ／ COLOR STORY 01", fontSizeCqw: 1.75, fontFamily: 'Arial, "Noto Sans SC", sans-serif', letterSpacing: ".22em", color: "#E5BD7A" },
      editorialRule: { ...rect(0.075, 0.087, 0.28, 0.002), color: "#E7BE78" },
      headline: { ...rect(0.07, 0.105, 0.68, 0.26), fontSizeCqw: 11.7, lineHeight: 0.93, maxLines: 2, fontFamily: 'Georgia, "Noto Serif SC", "Songti SC", serif', color: "#F3DEBC" },
      tagline: { ...rect(0.08, 0.31, 0.7, 0.09), fontSizeCqw: 4.2, lineHeight: 1.35, maxLines: 3, fontFamily: 'Arial, "Noto Sans SC", "PingFang SC", sans-serif', color: "#FFF4E4" },
      appointment: { ...rect(0.29, 0.78, 0.36, 0.14), fontSizeCqw: 2.05, lineHeight: 1.45, maxLines: 3, fontFamily: 'Arial, "Noto Sans SC", sans-serif', color: "#FFF4E4" },
      ornamentTop: rect(0.73, 0.005, 0.265, 0.3),
      ornamentBottom: rect(0.005, 0.61, 0.25, 0.26),
      accentBrush: rect(0.075, 0.38, 0.33, 0.06),
      watermarkSafeArea: rect(0.69, 0.87, 0.27, 0.09),
    },
    "story-9x16": {
      width: OUTPUT_SPECS["story-9x16"].width,
      height: OUTPUT_SPECS["story-9x16"].height,
      photo: rect(0, 0, 1, 1),
      focalPoint: point(0.66, 0.57),
      overlay: { x: 0, y: 0, width: 1, height: 1, gradient: "linear-gradient(180deg, rgba(26,10,16,.8) 0%, rgba(35,13,17,.58) 31%, rgba(35,13,17,.13) 58%, transparent 73%)" },
      atmosphereOverlay: { gradient: "radial-gradient(ellipse at 73% 17%, rgba(232,165,82,.18), transparent 33%), linear-gradient(180deg, transparent 55%, rgba(12,7,8,.3) 100%)", blendMode: "screen" },
      editorialEyebrow: { ...rect(0.075, 0.09, 0.62, 0.035), text: "AUTUMN ／ COLOR STORY 01", fontSizeCqw: 1.75, fontFamily: 'Arial, "Noto Sans SC", sans-serif', letterSpacing: ".22em", color: "#E5BD7A" },
      editorialRule: { ...rect(0.075, 0.132, 0.28, 0.002), color: "#E7BE78" },
      headline: { ...rect(0.07, 0.14, 0.82, 0.18), fontSizeCqw: 10.6, lineHeight: 0.95, maxLines: 2, fontFamily: 'Georgia, "Noto Serif SC", "Songti SC", serif', color: "#F3DEBC" },
      tagline: { ...rect(0.075, 0.28, 0.8, 0.08), fontSizeCqw: 3.9, lineHeight: 1.35, maxLines: 3, fontFamily: 'Arial, "Noto Sans SC", "PingFang SC", sans-serif', color: "#FFF4E4" },
      appointment: { ...rect(0.29, 0.79, 0.38, 0.15), fontSizeCqw: 1.9, lineHeight: 1.45, maxLines: 3, fontFamily: 'Arial, "Noto Sans SC", sans-serif', color: "#FFF4E4" },
      ornamentTop: rect(0.76, 0.045, 0.235, 0.22),
      ornamentBottom: rect(0.005, 0.68, 0.25, 0.22),
      accentBrush: rect(0.075, 0.37, 0.34, 0.045),
      watermarkSafeArea: rect(0.68, 0.84, 0.27, 0.08),
    },
  },
});

export const NAILS_AUTUMN_CAT_EYE_DESCRIPTOR: TemplateDescriptor = {
  id: NAILS_AUTUMN_CAT_EYE_01.id,
  version: NAILS_AUTUMN_CAT_EYE_01.version,
  adapterId: "react-layered-template",
  industryIds: ["nails"],
  fieldSpecs: NAILS_FIELD_CATALOG.filter((field) => field.id === "title" || field.id === "shortCopy" || field.id === "availabilityText"),
  photoSlots: [{ id: "hero", required: true, aspectRatio: 4 / 5, fit: "cover" }],
  outputs: [
    { id: "square", ...OUTPUT_SPECS.square, mime: "image/png" },
    { id: "portrait-4x5", ...OUTPUT_SPECS["portrait-4x5"], mime: "image/png" },
    { id: "story-9x16", ...OUTPUT_SPECS["story-9x16"], mime: "image/png" },
  ],
  watermarkSafeAreas: {
    square: NAILS_AUTUMN_CAT_EYE_01.layouts.square.watermarkSafeArea,
    "portrait-4x5": NAILS_AUTUMN_CAT_EYE_01.layouts["portrait-4x5"].watermarkSafeArea,
    "story-9x16": NAILS_AUTUMN_CAT_EYE_01.layouts["story-9x16"].watermarkSafeArea,
  },
};
