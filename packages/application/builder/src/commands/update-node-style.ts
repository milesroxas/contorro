import type {
  CompositionActor,
  CompositionRepository,
} from "@repo/domains-composition";
import { setNodeTokenStyle } from "@repo/domains-composition";
import { type AsyncResult, err } from "@repo/kernel";

import { saveValidated } from "../internal/save-validated.js";

export type UpdateNodeStyleError =
  | "COMPOSITION_NOT_FOUND"
  | "INVALID_NODE"
  | "PERSISTENCE_ERROR"
  | "FORBIDDEN"
  | "VALIDATION_ERROR";

export async function updateNodeStyleCommand(
  repo: CompositionRepository,
  args: {
    compositionId: string;
    nodeId: string;
    property: string;
    token: string;
    actor: CompositionActor;
  },
): AsyncResult<{ updatedAt: string }, UpdateNodeStyleError> {
  const existing = await repo.load(args.compositionId, args.actor);
  if (!existing) {
    return err("COMPOSITION_NOT_FOUND");
  }

  const next = setNodeTokenStyle(
    existing.composition,
    args.nodeId,
    args.property,
    args.token,
  );
  if (!next.ok) {
    return err("INVALID_NODE");
  }

  return saveValidated(repo, args.compositionId, next.value, args.actor);
}
