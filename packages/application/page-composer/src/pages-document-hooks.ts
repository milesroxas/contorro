import type { CollectionBeforeValidateHook } from "payload";

/**
 * Trims page slug; keeps composition vs Lexical boundary enforced by schema and admin copy (§3.1.6).
 */
export function createPagesBeforeValidateHandler(): CollectionBeforeValidateHook {
  return ({ data }) => {
    if (!data || typeof data !== "object") {
      return data;
    }
    const next = { ...data } as Record<string, unknown>;
    if (typeof next.slug === "string") {
      next.slug = next.slug.trim();
    }
    if (typeof next.title === "string") {
      next.title = next.title.trim();
    }
    return next;
  };
}
