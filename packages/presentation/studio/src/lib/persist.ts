import type { PageComposition } from "@repo/contracts-zod";
import { prepareCompositionForSave } from "@repo/presentation-shared";

/** Validates local composition before gateway save (architecture spec §10.3). */
export function prepareForSave(
  composition: PageComposition,
): { ok: true; data: PageComposition } | { ok: false } {
  return prepareCompositionForSave(composition);
}
