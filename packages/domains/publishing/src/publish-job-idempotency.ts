/**
 * Deterministic idempotency key for PublishJob — re-trigger with same inputs is a no-op (§5.6).
 */
export function makePublishJobIdempotencyKey(parts: {
  readonly scope: "page_publish" | "component_revision_publish" | "rollback";
  readonly targetId: string;
  readonly intentId: string;
}): string {
  return `${parts.scope}:${parts.targetId}:${parts.intentId}`;
}
