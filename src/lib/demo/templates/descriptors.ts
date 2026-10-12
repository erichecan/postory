import { OUTPUT_SPECS, type TemplateDescriptor } from "../contracts";
import { NAILS_FIELD_CATALOG } from "../industries/nails";
import { SUSHI_FIELD_CATALOG } from "../industries/sushi";
import { SUSHI_SIGNATURE_EDITORIAL_DESCRIPTOR } from "./sushi-signature-editorial-01";
import { NAILS_AUTUMN_CAT_EYE_DESCRIPTOR } from "./nails-autumn-cat-eye-01";
import { SUSHI_EDITORIAL_VARIANTS } from "./sushi-editorial-variants";
import { NAILS_EDITORIAL_DESCRIPTORS } from "./nails-editorial-variants";

export const NAILS_CLASSIC_TEMPLATE: TemplateDescriptor = {
  id: "nails-demo-classic",
  version: "1",
  adapterId: "demo-static-adapter",
  industryIds: ["nails"],
  fieldSpecs: NAILS_FIELD_CATALOG.filter((f) => f.id === "title" || f.id === "shortCopy" || f.id === "contactNote"),
  photoSlots: [{ id: "hero", required: true, aspectRatio: 2 / 3, fit: "cover" }],
  outputs: [{ id: "portrait-2x3", ...OUTPUT_SPECS["portrait-2x3"], mime: "image/png" }],
  watermarkSafeAreas: {
    "portrait-2x3": { x: 0.5, y: 0.88, width: 0.46, height: 0.09 },
  },
};

export const SUSHI_CLASSIC_TEMPLATE: TemplateDescriptor = {
  id: "sushi-demo-classic",
  version: "1",
  adapterId: "demo-static-adapter",
  industryIds: ["sushi"],
  fieldSpecs: SUSHI_FIELD_CATALOG.filter((f) => f.id === "title" || f.id === "dishName" || f.id === "shortCopy"),
  photoSlots: [{ id: "hero", required: true, aspectRatio: 2 / 3, fit: "cover" }],
  outputs: [{ id: "portrait-2x3", ...OUTPUT_SPECS["portrait-2x3"], mime: "image/png" }],
  watermarkSafeAreas: {
    "portrait-2x3": { x: 0.5, y: 0.88, width: 0.46, height: 0.09 },
  },
};

export const TEMPLATE_DESCRIPTORS: Record<string, TemplateDescriptor> = {
  "nails-demo-classic": NAILS_CLASSIC_TEMPLATE,
  "nails-autumn-cat-eye-01": NAILS_AUTUMN_CAT_EYE_DESCRIPTOR,
  ...NAILS_EDITORIAL_DESCRIPTORS,
  "sushi-demo-classic": SUSHI_CLASSIC_TEMPLATE,
  "sushi-signature-editorial-01": SUSHI_SIGNATURE_EDITORIAL_DESCRIPTOR,
  ...Object.fromEntries(Object.values(SUSHI_EDITORIAL_VARIANTS).map((template) => [template.id, {
    id: template.id,
    version: template.version,
    adapterId: "react-layered-template",
    industryIds: ["sushi"],
    fieldSpecs: SUSHI_FIELD_CATALOG.filter((field) => field.id === "title" || field.id === "shortCopy"),
    photoSlots: [{ id: "hero", required: true, aspectRatio: 4 / 5, fit: "cover" as const }],
    outputs: ["square", "portrait-4x5", "story-9x16"].map((id) => ({ id: id as "square" | "portrait-4x5" | "story-9x16", ...OUTPUT_SPECS[id as "square" | "portrait-4x5" | "story-9x16"], mime: "image/png" as const })),
    watermarkSafeAreas: Object.fromEntries(Object.entries(template.layouts).map(([id, layout]) => [id, layout.safeArea])),
  }])) as Record<string, TemplateDescriptor>,
};
