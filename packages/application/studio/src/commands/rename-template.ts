import type { CompositionActor } from "@repo/domains-composition";
import { type AsyncResult, err } from "@repo/kernel";

import type { BuilderMutationRepository } from "../ports/builder-mutation-repository.js";

export type RenameTemplateError =
  | "COMPOSITION_NOT_FOUND"
  | "PERSISTENCE_ERROR"
  | "FORBIDDEN"
  | "VALIDATION_ERROR";

export async function renameTemplateCommand(
  repo: BuilderMutationRepository,
  args: {
    compositionId: string;
    name: string;
    actor: CompositionActor;
  },
): AsyncResult<{ name: string; updatedAt: string }, RenameTemplateError> {
  const name = args.name.trim();
  if (name === "") {
    return err("VALIDATION_ERROR");
  }
  const existing = await repo.loadRevision(args.compositionId, args.actor);
  if (!existing) {
    return err("COMPOSITION_NOT_FOUND");
  }
  return repo.renameTemplate(args.compositionId, name, args.actor);
}
