import type {
  CompositionActor,
  CompositionRepository,
} from "@repo/domains-composition";
import { addChildNode } from "@repo/domains-composition";
import { type AsyncResult, err } from "@repo/kernel";

import { saveValidated } from "../internal/save-validated.js";

export type AddNodeError =
  | "COMPOSITION_NOT_FOUND"
  | "INVALID_NODE"
  | "PERSISTENCE_ERROR"
  | "FORBIDDEN"
  | "VALIDATION_ERROR";

export async function addNodeCommand(
  repo: CompositionRepository,
  args: {
    compositionId: string;
    parentId: string;
    definitionKey: string;
    actor: CompositionActor;
  },
): AsyncResult<{ updatedAt: string }, AddNodeError> {
  const existing = await repo.load(args.compositionId, args.actor);
  if (!existing) {
    return err("COMPOSITION_NOT_FOUND");
  }

  const next = addChildNode(
    existing.composition,
    args.parentId,
    args.definitionKey,
  );
  if (!next.ok) {
    return err("INVALID_NODE");
  }

  return saveValidated(repo, args.compositionId, next.value, args.actor);
}
