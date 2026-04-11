import { z } from "zod";

/** Component revision lifecycle — §5.6 (Phase 6). */
export const RevisionWorkflowStatusSchema = z.enum([
  "draft",
  "submitted",
  "approved",
  "published",
]);

export type RevisionWorkflowStatus = z.infer<
  typeof RevisionWorkflowStatusSchema
>;

export function canSubmitRevision(status: RevisionWorkflowStatus): boolean {
  return status === "draft";
}

export function canApproveRevision(status: RevisionWorkflowStatus): boolean {
  return status === "submitted";
}

export function canPublishRevision(status: RevisionWorkflowStatus): boolean {
  return status === "approved";
}

export function breakingChangePublishAllowed(
  isBreakingChange: boolean,
  dependencyImpactAcknowledgedAt: string | null | undefined,
): boolean {
  if (!isBreakingChange) {
    return true;
  }
  return (
    dependencyImpactAcknowledgedAt !== undefined &&
    dependencyImpactAcknowledgedAt !== null &&
    dependencyImpactAcknowledgedAt.length > 0
  );
}
