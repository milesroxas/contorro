/** Domain event type string for {@link TokenPublishedPayload}. */
export const TOKEN_PUBLISHED = "design-system.token-published" as const;

export type TokenPublishedPayload = {
  tokenSetId: string;
  scopeKey: string;
};
