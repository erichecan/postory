import { OUTPUT_SPECS, type TemplateDescriptor } from "../contracts";
import { NAILS_FIELD_CATALOG } from "../industries/nails";
import { SUSHI_FIELD_CATALOG } from "../industries/sushi";

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
  "sushi-demo-classic": SUSHI_CLASSIC_TEMPLATE,
};
