import type { PageComposition } from "@repo/contracts-zod";
import type {
  CompositionActor,
  CompositionRepository,
} from "@repo/domains-composition";
import { type AsyncResult, err } from "@repo/kernel";

import { saveValidated } from "../internal/save-validated.js";

export type SaveDraftError =
  | "COMPOSITION_NOT_FOUND"
  | "COMPOSITION_CONFLICT"
  | "PERSISTENCE_ERROR"
  | "FORBIDDEN"
  | "VALIDATION_ERROR";

export async function saveDraftCommand(
  repo: CompositionRepository,
  args: {
    compositionId: string;
    composition: PageComposition;
    ifMatchUpdatedAt: string | null | undefined;
    actor: CompositionActor;
  },
): AsyncResult<{ updatedAt: string }, SaveDraftError> {
  const existing = await repo.load(args.compositionId, args.actor);
  if (!existing) {
    return err("COMPOSITION_NOT_FOUND");
  }

  if (
    args.ifMatchUpdatedAt != null &&
    args.ifMatchUpdatedAt !== existing.updatedAt
  ) {
    return err("COMPOSITION_CONFLICT");
  }

  return saveValidated(repo, args.compositionId, args.composition, args.actor);
}
