import type {
  CompositionActor,
  CompositionRepository,
} from "@repo/domains-composition";
import { removeSubtree } from "@repo/domains-composition";
import { type AsyncResult, err } from "@repo/kernel";

import { saveValidated } from "../internal/save-validated.js";

export type RemoveNodeError =
  | "COMPOSITION_NOT_FOUND"
  | "INVALID_NODE"
  | "PERSISTENCE_ERROR"
  | "FORBIDDEN"
  | "VALIDATION_ERROR";

export async function removeNodeCommand(
  repo: CompositionRepository,
  args: {
    compositionId: string;
    nodeId: string;
    actor: CompositionActor;
  },
): AsyncResult<{ updatedAt: string }, RemoveNodeError> {
  const existing = await repo.load(args.compositionId, args.actor);
  if (!existing) {
    return err("COMPOSITION_NOT_FOUND");
  }

  const next = removeSubtree(existing.composition, args.nodeId);
  if (!next.ok) {
    return err("INVALID_NODE");
  }

  return saveValidated(repo, args.compositionId, next.value, args.actor);
}
