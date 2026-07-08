import type { DesignToken, DesignTokenSet, Result } from "@repo/contracts-zod";
import { err, ok } from "@repo/contracts-zod";
import { isValidTokenKey } from "./token-key.js";

export type { DesignToken, DesignTokenSet };

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

/** CSS injection guard — these characters can escape a declaration value. */
const FORBIDDEN_VALUE_CHARS = /[;{}<>\n\r]/;

const HEX_COLOR =
  /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const COLOR_FUNCTION = /^(?:rgb|rgba|hsl|hsla|oklch|color)\([^()]*\)$/i;
const COLOR_KEYWORD = /^[a-z-]+$/;

function isParseableCssColor(value: string): boolean {
  const trimmed = value.trim();
  return (
    HEX_COLOR.test(trimmed) ||
    COLOR_FUNCTION.test(trimmed) ||
    COLOR_KEYWORD.test(trimmed)
  );
}

function tokenValueValidationError(token: DesignToken): string | null {
  if (FORBIDDEN_VALUE_CHARS.test(token.resolvedValue)) {
    return `Token "${token.key}" has an invalid value: ";", "{", "}", "<", ">" and newlines are not allowed in token values`;
  }
  if (token.category === "color" && !isParseableCssColor(token.resolvedValue)) {
    return `Token "${token.key}" must be a CSS color: hex (#rgb…#rrggbbaa), rgb()/rgba()/hsl()/hsla()/oklch()/color() function, or a color keyword`;
  }
  return null;
}

/**
 * Validates token keys, duplicate keys, and resolved values (CSS injection guard +
 * per-category value shape); used before persistence. Errors are editor-facing messages.
 */
export function validateTokensForSave(
  tokens: DesignToken[],
): Result<void, string> {
  const seen = new Set<string>();
  for (const t of tokens) {
    if (!isValidTokenKey(t.key)) {
      return err(
        `Invalid token key "${t.key}" — expected "{category}.{name}" (e.g. "color.primary")`,
      );
    }
    const mode = t.mode === "dark" ? "dark" : "light";
    const modeKey = `${mode}:${t.key}`;
    if (seen.has(modeKey)) {
      return err(`Duplicate token key "${t.key}" for ${mode} mode`);
    }
    seen.add(modeKey);
    const valueError = tokenValueValidationError(t);
    if (valueError !== null) {
      return err(valueError);
    }
  }
  return ok(undefined);
}

/**
 * Keys present in a previously-published set but missing from `next`. Additions are
 * always fine; removals/renames only block publishing (enforced by the beforeChange
 * hook when the incoming `_status` is `"published"`).
 */
export function findRemovedPublishedTokenKeys(
  previous: DesignTokenSet | null,
  next: DesignTokenSet,
): string[] {
  if (!previous?.hasBeenPublished) {
    return [];
  }
  const nextKeys = new Set(next.tokens.map((t) => t.key));
  const removed: string[] = [];
  const seen = new Set<string>();
  for (const t of previous.tokens) {
    if (!nextKeys.has(t.key) && !seen.has(t.key)) {
      removed.push(t.key);
      seen.add(t.key);
    }
  }
  return removed;
}
