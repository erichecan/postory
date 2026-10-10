import type { ContentDraft, FieldValue, MediaAsset, TemplateDescriptor, ValidationIssue } from "../contracts";
import { TEMPLATE_DESCRIPTORS } from "./descriptors";

export function getTemplateDescriptor(templateId: string): TemplateDescriptor | null {
  return TEMPLATE_DESCRIPTORS[templateId] ?? null;
}

function graphemeLength(value: string): number {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    return Array.from(segmenter.segment(value)).length;
  }
  return Array.from(value).length;
}

/**
 * The demo's hand-built templates are their own adapters: this module is the one
 * place that turns a draft+assets into (a) validation issues and (b) resolved
 * props for the React template component — matching V2.0 §7's "适配器是唯一协议
 * 转换位置" even though there's no generic third-party template JSON to translate.
 */
export function validateDraft(descriptor: TemplateDescriptor, draft: ContentDraft, assets: MediaAsset[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const assetById = new Map(assets.map((a) => [a.id, a]));

  for (const field of descriptor.fieldSpecs) {
    const value = draft.fields[field.id];
    if (field.required && (value === undefined || value === "" || (Array.isArray(value) && value.length === 0))) {
      issues.push({ path: `fields.${field.id}`, code: "required", messageKey: "demo.error.fieldRequired" });
      continue;
    }
    if (typeof value === "string" && field.maxLength && graphemeLength(value) > field.maxLength) {
      issues.push({ path: `fields.${field.id}`, code: "too-long", messageKey: "demo.error.fieldTooLong" });
    }
    if (Array.isArray(value) && field.kind === "text-list") {
      if (field.maxItems && value.length > field.maxItems) {
        issues.push({ path: `fields.${field.id}`, code: "too-many-items", messageKey: "demo.error.listTooLong" });
      }
      if (field.itemMaxLength) {
        for (const item of value) {
          if (graphemeLength(item) > field.itemMaxLength) {
            issues.push({ path: `fields.${field.id}`, code: "item-too-long", messageKey: "demo.error.listItemTooLong" });
            break;
          }
        }
      }
    }
  }

  for (const slot of descriptor.photoSlots) {
    const binding = draft.bindings.find((b) => b.slotId === slot.id);
    if (slot.required && !binding) {
      issues.push({ path: `bindings.${slot.id}`, code: "missing-slot", messageKey: "demo.error.photoSlotMissing" });
      continue;
    }
    if (binding) {
      const asset = assetById.get(binding.assetId);
      if (!asset || asset.status !== "ready") {
        issues.push({ path: `bindings.${slot.id}`, code: "asset-not-ready", messageKey: "demo.error.assetNotReady" });
      }
    }
  }

  const outputSupported = descriptor.outputs.some((o) => o.id === draft.outputId);
  if (!outputSupported) {
    issues.push({ path: "outputId", code: "unsupported-output", messageKey: "demo.error.outputUnsupported" });
  }

  return issues;
}

export interface ResolvedTemplateProps {
  fields: Record<string, FieldValue>;
  photoAssetIdBySlot: Record<string, string>;
}

export function resolveTemplateProps(descriptor: TemplateDescriptor, draft: ContentDraft): ResolvedTemplateProps {
  const photoAssetIdBySlot: Record<string, string> = {};
  for (const slot of descriptor.photoSlots) {
    const binding = draft.bindings.find((b) => b.slotId === slot.id);
    if (binding) photoAssetIdBySlot[slot.id] = binding.assetId;
  }
  return { fields: draft.fields, photoAssetIdBySlot };
}
