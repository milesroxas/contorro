import { OverrideValueSchema } from "@repo/contracts-zod";
import type { Result } from "@repo/kernel";
import { err, ok } from "@repo/kernel";

/** Validates JSON override payloads for `design-token-overrides` (spec Phase 1). */
export function validateDesignTokenOverrideValue(
  raw: unknown,
): Result<void, "INVALID_OVERRIDE"> {
  const parsed = OverrideValueSchema.safeParse(raw);
  if (!parsed.success) {
    return err("INVALID_OVERRIDE");
  }
  return ok(undefined);
}
