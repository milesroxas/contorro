import type { PageComposition } from "@repo/contracts-zod";
import { PageCompositionSchema } from "@repo/contracts-zod";
import type {
  CompositionActor,
  CompositionRepository,
} from "@repo/domains-composition";
import { validatePageCompositionInvariants } from "@repo/domains-composition";
import { type AsyncResult, err } from "@repo/kernel";

export async function saveValidated(
  repo: CompositionRepository,
  id: string,
  composition: PageComposition,
  actor: CompositionActor,
): AsyncResult<
  { updatedAt: string },
  "PERSISTENCE_ERROR" | "FORBIDDEN" | "VALIDATION_ERROR"
> {
  const parsed = PageCompositionSchema.safeParse(composition);
  if (!parsed.success) {
    return err("VALIDATION_ERROR");
  }
  const inv = validatePageCompositionInvariants(parsed.data);
  if (!inv.ok) {
    return err("VALIDATION_ERROR");
  }
  return repo.saveDraft(id, parsed.data, actor);
}
