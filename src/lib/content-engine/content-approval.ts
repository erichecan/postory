import { createHash } from "node:crypto";
import { CONTENT_FORMATS, type ContentFormat, type ContentTemplate } from "./deterministic-renderer";

/**
 * Fully specified customer-confirmed copy, bound to one approved brand revision.
 * Promotional offers are deliberately excluded from publish export until a
 * layout includes complete legally necessary terms, dates and restrictions.
 */
export type ApprovedContentManifest = {
  schemaVersion: 1;
  shopId: string;
  brandApprovalEventId: string;
  brandRevision: number;
  assetId: string;
  format: ContentFormat;
  template: ContentTemplate;
  headline: string;
  subheadline: string;
  cta: string;
  approvedBy: string;
  approvedAt: string;
  digest: string;
};
type ContentInput = Pick<ApprovedContentManifest,
  "shopId"|"brandApprovalEventId"|"brandRevision"|"assetId"|"format"|"template"|"headline"|"subheadline"|"cta">;
const TEMPLATES: ContentTemplate[]=["food-editorial","product-feature","local-story"];
const ASSET_ID=/^[a-f0-9]{24}$/;
const SHOP_ID=/^[a-z0-9]{10,40}$/;
const APPROVAL_ID=/^[a-z0-9]{10,40}$/;
export function parseContentApprovalInput(value: unknown): ContentInput | null {
  if (!value || typeof value!=="object" || Array.isArray(value)) return null;
  const v=value as Record<string,unknown>;
  // Fail closed: a promotion cannot be silently omitted or partially displayed.
  if ("offer" in v || "price" in v || "percentOff" in v) return null;
  if (typeof v.shopId!=="string" || !SHOP_ID.test(v.shopId) ||
      typeof v.brandApprovalEventId!=="string" || !APPROVAL_ID.test(v.brandApprovalEventId) ||
      !Number.isSafeInteger(v.brandRevision) || (v.brandRevision as number)<1 ||
      typeof v.assetId!=="string" || !ASSET_ID.test(v.assetId) ||
      !Object.hasOwn(CONTENT_FORMATS,String(v.format)) ||
      !TEMPLATES.includes(v.template as ContentTemplate) ||
      typeof v.headline!=="string" || !v.headline.trim() || Array.from(v.headline).length>55 ||
      typeof v.subheadline!=="string" || Array.from(v.subheadline).length>62 ||
      typeof v.cta!=="string" || Array.from(v.cta).length>28) return null;
  if ([v.headline,v.subheadline,v.cta].some(s=>/[\u0000-\u001f\u007f]/.test(s as string))) return null;
  return {
    shopId:v.shopId,brandApprovalEventId:v.brandApprovalEventId,
    brandRevision:v.brandRevision as number,assetId:v.assetId,
    format:v.format as ContentFormat,template:v.template as ContentTemplate,
    headline:v.headline,subheadline:v.subheadline,cta:v.cta,
  };
}
export function contentApprovalDigest(input: ContentInput): string {
  const parts=[input.shopId,input.brandApprovalEventId,String(input.brandRevision),
    input.assetId,input.format,input.template,input.headline,input.subheadline,input.cta];
  return createHash("sha256").update(JSON.stringify(parts)).digest("hex");
}
export function createApprovedContentManifest(input: ContentInput, actorId: string, now: string): ApprovedContentManifest {
  if (!actorId.trim() || !Number.isFinite(Date.parse(now))) throw new Error("invalid_approval_actor_or_time");
  return {...input,schemaVersion:1,approvedBy:actorId,approvedAt:now,digest:contentApprovalDigest(input)};
}
export function isApprovedContentManifest(value: unknown): value is ApprovedContentManifest {
  if (!value || typeof value!=="object" || Array.isArray(value)) return false;
  const v=value as Record<string,unknown>;
  const parsed=parseContentApprovalInput(value);
  return !!parsed && v.schemaVersion===1 &&
    typeof v.approvedBy==="string" && v.approvedBy.trim().length>0 &&
    typeof v.approvedAt==="string" && Number.isFinite(Date.parse(v.approvedAt)) &&
    typeof v.digest==="string" && v.digest===contentApprovalDigest(parsed);
}
