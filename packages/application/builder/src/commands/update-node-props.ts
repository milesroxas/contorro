import type {
  CompositionActor,
  CompositionRepository,
} from "@repo/domains-composition";
import { updateNodePropValues } from "@repo/domains-composition";
import { type AsyncResult, err } from "@repo/kernel";

import { saveValidated } from "../internal/save-validated.js";

export type UpdateNodePropsError =
  | "COMPOSITION_NOT_FOUND"
  | "INVALID_NODE"
  | "PERSISTENCE_ERROR"
  | "FORBIDDEN"
  | "VALIDATION_ERROR";

export async function updateNodePropsCommand(
  repo: CompositionRepository,
  args: {
    compositionId: string;
    nodeId: string;
    patch: Record<string, unknown>;
    actor: CompositionActor;
  },
): AsyncResult<{ updatedAt: string }, UpdateNodePropsError> {
  const existing = await repo.load(args.compositionId, args.actor);
  if (!existing) {
    return err("COMPOSITION_NOT_FOUND");
  }

  const next = updateNodePropValues(
    existing.composition,
    args.nodeId,
    args.patch,
  );
  if (!next.ok) {
    return err("INVALID_NODE");
  }

  return saveValidated(repo, args.compositionId, next.value, args.actor);
}
