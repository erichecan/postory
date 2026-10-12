import { layeredTemplateSchema, OUTPUT_SPECS, type TemplateDescriptor } from "../contracts";
import { SUSHI_FIELD_CATALOG } from "../industries/sushi";

const rect = (x: number, y: number, width: number, height: number) => ({ x, y, width, height });
const point = (x: number, y: number) => ({ x, y });

export const SUSHI_SIGNATURE_EDITORIAL_01 = layeredTemplateSchema.parse({
  schemaVersion: 1,
  id: "sushi-signature-editorial-01",
  version: "1.0.0",
  industryId: "sushi",
  categoryId: "signature",
  family: "full-bleed-editorial",
  slots: [
    { id: "hero", type: "image", required: true, fit: "cover", defaultFocalPoint: point(0.55, 0.6) },
    { id: "headline", type: "text", fieldId: "title", required: true, maxLength: 32, maxLines: 2, defaultValue: "Fresh\nSushi", transform: "none" },
    { id: "tagline", type: "text", fieldId: "shortCopy", required: false, maxLength: 72, maxLines: 3, defaultValue: "SIMPLE INGREDIENTS\nEXTRAORDINARY TASTE", transform: "uppercase" },
    { id: "availability", type: "text", fieldId: "availabilityText", required: false, maxLength: 80, maxLines: 3, defaultValue: "", transform: "none" },
  ],
  decorationAssets: {
    ornamentTop: "/demo/templates/sushi/assets/botanical-top.svg",
    ornamentBottom: "/demo/templates/sushi/assets/botanical-bottom.svg",
    accentBrush: "/demo/templates/sushi/assets/accent-brush.png",
  },
  selectionBadge: "outside-renderer",
  layouts: {
    square: {
      width: 1080,
      height: 1080,
      photo: rect(0, 0, 1, 1),
      focalPoint: point(0.55, 0.58),
      overlay: { x: 0, y: 0, width: 1, height: 1, gradient: "linear-gradient(105deg, rgba(8,7,6,.62) 0%, rgba(8,7,6,.3) 52%, transparent 78%)" },
      headline: { ...rect(0.055, 0.2, 0.67, 0.27), fontSizeCqw: 10, lineHeight: 0.96, maxLines: 2, fontFamily: 'Georgia, "Times New Roman", serif' },
      tagline: { ...rect(0.058, 0.54, 0.72, 0.13), fontSizeCqw: 3.2, lineHeight: 1.35, maxLines: 3, fontFamily: 'Arial, "Noto Sans", sans-serif' },
      appointment: { ...rect(0.07, 0.8, 0.62, 0.14), fontSizeCqw: 2, lineHeight: 1.28, maxLines: 3, fontFamily: 'Arial, "Noto Sans", sans-serif', color: "#FFF4DF" },
      ornamentTop: rect(0.5, 0.43, 0.14, 0.14),
      ornamentBottom: rect(0.05, 0.76, 0.17, 0.16),
      accentBrush: rect(0.07, 0.68, 0.27, 0.045),
      watermarkSafeArea: rect(0.68, 0.86, 0.27, 0.1),
    },
    "portrait-4x5": {
      width: 1080,
      height: 1350,
      photo: rect(0, 0, 1, 1),
      focalPoint: point(0.55, 0.6),
      overlay: { x: 0, y: 0, width: 1, height: 1, gradient: "linear-gradient(105deg, rgba(8,7,6,.62) 0%, rgba(8,7,6,.3) 52%, transparent 78%)" },
      headline: { ...rect(0.055, 0.19, 0.66, 0.22), fontSizeCqw: 10.6, lineHeight: 0.94, maxLines: 2, fontFamily: 'Georgia, "Times New Roman", serif' },
      tagline: { ...rect(0.058, 0.43, 0.69, 0.1), fontSizeCqw: 3.25, lineHeight: 1.35, maxLines: 3, fontFamily: 'Arial, "Noto Sans", sans-serif' },
      appointment: { ...rect(0.07, 0.8, 0.62, 0.14), fontSizeCqw: 2, lineHeight: 1.28, maxLines: 3, fontFamily: 'Arial, "Noto Sans", sans-serif', color: "#FFF4DF" },
      ornamentTop: rect(0.5, 0.33, 0.13, 0.12),
      ornamentBottom: rect(0.06, 0.72, 0.15, 0.12),
      accentBrush: rect(0.075, 0.555, 0.25, 0.04),
      watermarkSafeArea: rect(0.69, 0.87, 0.27, 0.09),
    },
    "story-9x16": {
      width: 1080,
      height: 1920,
      photo: rect(0, 0, 1, 1),
      focalPoint: point(0.55, 0.55),
      overlay: { x: 0, y: 0, width: 1, height: 1, gradient: "linear-gradient(180deg, rgba(8,7,6,.66) 0%, rgba(8,7,6,.34) 28%, transparent 49%)" },
      headline: { ...rect(0.07, 0.18, 0.8, 0.17), fontSizeCqw: 10.8, lineHeight: 0.96, maxLines: 2, fontFamily: 'Georgia, "Times New Roman", serif' },
      tagline: { ...rect(0.075, 0.37, 0.78, 0.1), fontSizeCqw: 3.4, lineHeight: 1.35, maxLines: 3, fontFamily: 'Arial, "Noto Sans", sans-serif' },
      appointment: { ...rect(0.07, 0.8, 0.62, 0.14), fontSizeCqw: 2, lineHeight: 1.28, maxLines: 3, fontFamily: 'Arial, "Noto Sans", sans-serif', color: "#FFF4DF" },
      ornamentTop: rect(0.6, 0.3, 0.18, 0.09),
      ornamentBottom: rect(0.06, 0.75, 0.19, 0.1),
      accentBrush: rect(0.09, 0.495, 0.28, 0.035),
      watermarkSafeArea: rect(0.68, 0.72, 0.27, 0.08),
    },
  },
});

export const SUSHI_SIGNATURE_EDITORIAL_DESCRIPTOR: TemplateDescriptor = {
  id: SUSHI_SIGNATURE_EDITORIAL_01.id,
  version: SUSHI_SIGNATURE_EDITORIAL_01.version,
  adapterId: "react-layered-template",
  industryIds: ["sushi"],
  fieldSpecs: SUSHI_FIELD_CATALOG.filter((field) => field.id === "title" || field.id === "shortCopy" || field.id === "availabilityText"),
  photoSlots: [{ id: "hero", required: true, aspectRatio: 4 / 5, fit: "cover" }],
  outputs: [
    { id: "square", ...OUTPUT_SPECS.square, mime: "image/png" },
    { id: "portrait-4x5", ...OUTPUT_SPECS["portrait-4x5"], mime: "image/png" },
    { id: "story-9x16", ...OUTPUT_SPECS["story-9x16"], mime: "image/png" },
  ],
  watermarkSafeAreas: {
    square: SUSHI_SIGNATURE_EDITORIAL_01.layouts.square.watermarkSafeArea,
    "portrait-4x5": SUSHI_SIGNATURE_EDITORIAL_01.layouts["portrait-4x5"].watermarkSafeArea,
    "story-9x16": SUSHI_SIGNATURE_EDITORIAL_01.layouts["story-9x16"].watermarkSafeArea,
  },
};
