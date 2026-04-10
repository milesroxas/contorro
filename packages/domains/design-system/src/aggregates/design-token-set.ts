import type { Result } from "@repo/kernel";
import { err, ok } from "@repo/kernel";
import type { DesignToken } from "../entities/design-token.js";
import { isValidTokenKey } from "../value-objects/token-key.js";

export type DesignTokenSet = {
  id: string;
  title: string;
  /** Stable scope identifier (e.g. brand / theme). */
  scopeKey: string;
  tokens: DesignToken[];
  /** When true, token keys in this set must not be renamed or removed (only value updates). */
  hasBeenPublished: boolean;
};

export function createDesignTokenSet(
  input: Omit<DesignTokenSet, "hasBeenPublished"> & {
    hasBeenPublished?: boolean;
  },
): DesignTokenSet {
  return {
    ...input,
    hasBeenPublished: input.hasBeenPublished ?? false,
  };
}

/** Validates token keys and duplicate keys; used before persistence. */
export function validateTokensForSave(
  tokens: DesignToken[],
): Result<void, "INVALID_TOKEN_KEY" | "DUPLICATE_TOKEN_KEY"> {
  const seen = new Set<string>();
  for (const t of tokens) {
    if (!isValidTokenKey(t.key)) {
      return err("INVALID_TOKEN_KEY");
    }
    if (seen.has(t.key)) {
      return err("DUPLICATE_TOKEN_KEY");
    }
    seen.add(t.key);
  }
  return ok(undefined);
}

/**
 * Enforces “token keys immutable after first publish” when mutating an already-published set.
 */
export function assertTokenKeyStability(
  previous: DesignTokenSet | null,
  next: DesignTokenSet,
): Result<void, "TOKEN_KEY_IMMUTABLE"> {
  if (!previous?.hasBeenPublished) {
    return ok(undefined);
  }
  const prevKeys = new Set(previous.tokens.map((t) => t.key));
  const nextKeys = new Set(next.tokens.map((t) => t.key));
  if (prevKeys.size !== nextKeys.size) {
    return err("TOKEN_KEY_IMMUTABLE");
  }
  for (const k of prevKeys) {
    if (!nextKeys.has(k)) {
      return err("TOKEN_KEY_IMMUTABLE");
    }
  }
  return ok(undefined);
}
