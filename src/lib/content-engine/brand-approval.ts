import type { BrandProfileDraft } from "./brand-profile";
import { checkBrandProfileForApproval } from "./brand-profile";

/**
 * Pure approval state machine. The API caller MUST authenticate actorId and
 * authorize it for this tenant; an arbitrary client-supplied actorId is not proof.
 * Persistence must use compare-and-swap on (profileId, version, status).
 */
export class BrandApprovalError extends Error {
  constructor(public readonly reason: string) {
    super(reason);
    this.name = "BrandApprovalError";
  }
}

export type BrandReviewEvent = {
  profileId: string;
  tenantId: string;
  version: number;
  actorId: string;
  action: "submitted" | "approved" | "changes_requested" | "superseded";
  occurredAt: string;
};

export type BrandTransition = {
  profile: BrandProfileDraft;
  event: BrandReviewEvent;
};

function timestamp(now: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(now) ||
      !Number.isFinite(Date.parse(now))) throw new BrandApprovalError("invalid_timestamp");
  return now;
}

function event(
  profile: BrandProfileDraft,
  actorId: string,
  action: BrandReviewEvent["action"],
  now: string,
): BrandReviewEvent {
  if (!actorId.trim()) throw new BrandApprovalError("missing_actor");
  return {
    profileId: profile.profileId,
    tenantId: profile.tenantId,
    version: profile.version,
    actorId,
    action,
    occurredAt: timestamp(now),
  };
}

function clone(profile: BrandProfileDraft): BrandProfileDraft {
  // Prevent later mutation of the caller's arrays/fields from altering a returned revision.
  return structuredClone(profile);
}

export function submitBrandForReview(
  input: BrandProfileDraft, actorId: string, now: string,
): BrandTransition {
  if (input.status !== "draft") throw new BrandApprovalError("not_draft");
  const profile = clone(input);
  const reviewEvent = event(profile, actorId, "submitted", now);
  profile.status = "pending_review";
  profile.updatedAt = reviewEvent.occurredAt;
  return { profile, event: reviewEvent };
}

export function decideBrandReview(
  input: BrandProfileDraft,
  actorId: string,
  decision: "approve" | "request_changes",
  now: string,
): BrandTransition {
  if (input.status !== "pending_review") throw new BrandApprovalError("not_pending_review");
  const profile = clone(input);
  const action = decision === "approve" ? "approved" : "changes_requested";
  const reviewEvent = event(profile, actorId, action, now);
  if (decision === "approve") {
    const check = checkBrandProfileForApproval(profile);
    if (!check.canApprove) throw new BrandApprovalError(check.blockers.join(","));
    profile.status = "approved";
    profile.approvedAt = reviewEvent.occurredAt;
    profile.approvedBy = actorId;
  } else {
    profile.status = "draft";
    delete profile.approvedAt;
    delete profile.approvedBy;
  }
  profile.updatedAt = reviewEvent.occurredAt;
  return { profile, event: reviewEvent };
}

/** Editing an approved profile requires an independent, unapproved revision. */
export function reviseApprovedBrand(
  input: BrandProfileDraft, actorId: string, now: string,
): BrandTransition {
  if (input.status !== "approved") throw new BrandApprovalError("not_approved");
  const profile = clone(input);
  const reviewEvent = event(profile, actorId, "superseded", now);
  profile.version += 1;
  profile.status = "draft";
  profile.updatedAt = reviewEvent.occurredAt;
  delete profile.approvedAt;
  delete profile.approvedBy;
  return { profile, event: reviewEvent };
}

/** A publish check is not an authorization substitute or a DB version lock. */
export function isApprovedBrandSnapshot(profile: BrandProfileDraft): boolean {
  return profile.status === "approved" &&
    Boolean(profile.approvedBy?.trim()) &&
    Boolean(profile.approvedAt && !Number.isNaN(Date.parse(profile.approvedAt))) &&
    checkBrandProfileForApproval(profile).canApprove;
}
