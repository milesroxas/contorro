import type { PageComposition } from "@repo/contracts-zod";
import { PageCompositionSchema } from "@repo/contracts-zod";
import { validatePageCompositionInvariants } from "@repo/domains-composition";

/**
 * Validates local composition before gateway save (architecture spec §10.3).
 */
export function prepareForSave(
  composition: PageComposition,
): { ok: true; data: PageComposition } | { ok: false } {
  const parsed = PageCompositionSchema.safeParse(composition);
  if (!parsed.success) {
    return { ok: false };
  }
  const inv = validatePageCompositionInvariants(parsed.data);
  if (!inv.ok) {
    return { ok: false };
  }
  return { ok: true, data: parsed.data };
}
