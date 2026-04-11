/** Stable event type strings for subscribers (Phase 6 — typed registry baseline). */
export const PUBLISHING_EVENT_TYPES = {
  revisionSubmitted: "publishing.revision.submitted",
  revisionApproved: "publishing.revision.approved",
  publishJobSucceeded: "publishing.publishJob.succeeded",
  pagePublished: "publishing.page.published",
  pageRolledBack: "publishing.page.rolledBack",
} as const;

export type PublishingEventType =
  (typeof PUBLISHING_EVENT_TYPES)[keyof typeof PUBLISHING_EVENT_TYPES];

export type DomainEvent<T extends string, P> = {
  type: T;
  occurredAt: Date;
  payload: P;
};

export interface EventBus {
  publish<E extends DomainEvent<string, unknown>>(event: E): Promise<void>;
  /** Returns a function that removes this handler (idempotent). */
  subscribe<E extends DomainEvent<string, unknown>>(
    type: E["type"],
    handler: (event: E) => Promise<void>,
  ): () => void;
}
