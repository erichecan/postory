import type { ReactElement } from "react";
import type { FieldValue } from "../contracts";
import { NailsClassicTemplate } from "@/components/demo/templates/nails-classic";
import { SushiClassicTemplate } from "@/components/demo/templates/sushi-classic";

export interface TemplateComponentProps {
  photoUrl: string | null;
  fields: Record<string, FieldValue>;
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
};
