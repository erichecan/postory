import type { ReactElement } from "react";
import type { FieldValue, OutputId } from "../contracts";
import { NailsClassicTemplate } from "@/components/demo/templates/nails-classic";
import { SushiClassicTemplate } from "@/components/demo/templates/sushi-classic";
import { FullBleedEditorialFamily } from "@/components/demo/templates/families/full-bleed-editorial";
import { SUSHI_SIGNATURE_EDITORIAL_01 } from "./sushi-signature-editorial-01";
import { NAILS_AUTUMN_CAT_EYE_01 } from "./nails-autumn-cat-eye-01";
import { NAILS_EDITORIAL_VARIANTS, NAILS_TEMPLATE_DEFAULTS, type NailsEditorialVariantId } from "./nails-editorial-variants";
import { SushiEditorialFamily } from "@/components/demo/templates/families/sushi-editorial-family";
import { SUSHI_EDITORIAL_VARIANTS, type SushiEditorialVariantId } from "./sushi-editorial-variants";

export interface TemplateComponentProps {
  photoUrl: string | null;
  fields: Record<string, FieldValue>;
  outputId?: OutputId;
  focalPoint?: { x: number; y: number };
  zoom?: number;
  mode?: "thumbnail" | "preview" | "export";
}

function asText(value: FieldValue | undefined): string {
  return typeof value === "string" ? value : "";
}

export const TEMPLATE_COMPONENTS: Record<string, (props: TemplateComponentProps) => ReactElement> = {
  "nails-demo-classic": ({ photoUrl, fields }) => (
    <NailsClassicTemplate photoUrl={photoUrl} title={asText(fields.title)} shortCopy={asText(fields.shortCopy)} />
  ),
  "sushi-demo-classic": ({ photoUrl, fields }) => (
    <SushiClassicTemplate photoUrl={photoUrl} title={asText(fields.title)} dishName={asText(fields.dishName) || undefined} shortCopy={asText(fields.shortCopy)} />
  ),
  "nails-autumn-cat-eye-01": ({ photoUrl, fields, outputId = "portrait-4x5", focalPoint, zoom, mode = "preview" }) => (
    <FullBleedEditorialFamily
      definition={NAILS_AUTUMN_CAT_EYE_01}
      photoUrl={photoUrl}
      headline={asText(fields.title) || "秋日猫眼\n新品上线"}
      tagline={asText(fields.shortCopy) || (fields.shortCopy === "" ? "" : "一抹流光，点亮秋日")}
      appointmentText={asText(fields.availabilityText)}
      outputId={outputId}
      focalPoint={focalPoint}
      zoom={zoom}
      mode={mode}
    />
  ),
  ...Object.fromEntries(Object.keys(NAILS_EDITORIAL_VARIANTS).map((id) => [id, ({ photoUrl, fields, outputId = "portrait-4x5", focalPoint, zoom, mode = "preview" }: TemplateComponentProps) => {
    const templateId = id as NailsEditorialVariantId;
    const definition = NAILS_EDITORIAL_VARIANTS[templateId];
    const defaults = NAILS_TEMPLATE_DEFAULTS[templateId];
    return <FullBleedEditorialFamily
      definition={definition}
      photoUrl={photoUrl}
      headline={asText(fields.title) || defaults.title}
      tagline={asText(fields.shortCopy) || (fields.shortCopy === "" ? "" : defaults.shortCopy)}
      appointmentText={asText(fields.availabilityText)}
      outputId={outputId}
      focalPoint={focalPoint}
      zoom={zoom}
      mode={mode}
    />;
  }])),
  "sushi-signature-editorial-01": ({ photoUrl, fields, outputId = "portrait-4x5", focalPoint, zoom, mode = "preview" }) => (
    <FullBleedEditorialFamily
      definition={SUSHI_SIGNATURE_EDITORIAL_01}
      photoUrl={photoUrl}
      headline={asText(fields.title) || "Fresh\nSushi"}
      tagline={asText(fields.shortCopy) || (fields.shortCopy === "" ? "" : "SIMPLE INGREDIENTS\nEXTRAORDINARY TASTE")}
      appointmentText={asText(fields.availabilityText)}
      outputId={outputId}
      focalPoint={focalPoint}
      zoom={zoom}
      mode={mode}
    />
  ),
  ...Object.fromEntries(Object.keys(SUSHI_EDITORIAL_VARIANTS).map((id) => [id, ({ photoUrl, fields, outputId = "portrait-4x5", focalPoint, zoom, mode = "preview" }: TemplateComponentProps) => (
    <SushiEditorialFamily
      templateId={id as SushiEditorialVariantId}
      photoUrl={photoUrl}
      headline={asText(fields.title) || SUSHI_EDITORIAL_VARIANTS[id as SushiEditorialVariantId].headlineDefault}
      tagline={asText(fields.shortCopy) || (fields.shortCopy === "" ? "" : SUSHI_EDITORIAL_VARIANTS[id as SushiEditorialVariantId].taglineDefault)}
      availabilityText={asText(fields.availabilityText)}
      outputId={outputId}
      focalPoint={focalPoint}
      zoom={zoom}
      mode={mode}
    />
  )])),
};
