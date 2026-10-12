import type { CSSProperties } from "react";
import type { FieldValue, OutputId } from "@/lib/demo/contracts";
import { TEMPLATE_COMPONENTS } from "@/lib/demo/templates/component-registry";

export interface TemplateRendererProps {
  templateId: string;
  photoUrl: string | null;
  fields: Record<string, FieldValue>;
  outputId: OutputId;
  focalPoint?: { x: number; y: number };
  zoom?: number;
  mode: "thumbnail" | "preview" | "export";
  className?: string;
  style?: CSSProperties;
}

/** All template surfaces call this same registry and component entry point. */
export function TemplateRenderer({ templateId, photoUrl, fields, outputId, focalPoint, zoom, mode, className = "", style }: TemplateRendererProps) {
  const Component = TEMPLATE_COMPONENTS[templateId];
  if (!Component) return null;
  return <div className={`template-renderer ${className}`} data-template-id={templateId} style={{ width: "100%", height: "100%", ...style }}>
    <Component photoUrl={photoUrl} fields={fields} outputId={outputId} focalPoint={focalPoint} zoom={zoom} mode={mode} />
  </div>;
}
