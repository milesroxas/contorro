import { type AsyncResult, err } from "@repo/contracts-zod";

import type {
  StudioMutationRepository,
  UpdateCompositionMetaPatch,
} from "./studio-mutation-repository.js";

export type UpdateCompositionMetaError =
  | "COMPOSITION_NOT_FOUND"
  | "PERSISTENCE_ERROR"
  | "FORBIDDEN"
  | "VALIDATION_ERROR";

/**
 * Updates composition metadata (title and/or blockType) — never resubmits the
 * composition tree. `blockType` is components-only; the route enforces that.
 */
export async function updateCompositionMetaCommand(
  repo: StudioMutationRepository,
  args: {
    compositionId: string;
    patch: UpdateCompositionMetaPatch;
    intent: "draft" | "publish";
  },
): AsyncResult<
  {
    name: string;
    updatedAt: string;
    blockType?: string | null;
    _status?: "draft" | "published" | null;
  },
  UpdateCompositionMetaError
> {
  const name = args.patch.name?.trim();
  if (name === "") {
    return err("VALIDATION_ERROR");
  }
  if (name === undefined && args.patch.blockType === undefined) {
    return err("VALIDATION_ERROR");
  }
  const existing = await repo.loadRevision(args.compositionId);
  if (!existing) {
    return err("COMPOSITION_NOT_FOUND");
  }
  return repo.updateMeta(
    args.compositionId,
    {
      ...(name !== undefined ? { name } : {}),
      ...(args.patch.blockType !== undefined
        ? { blockType: args.patch.blockType }
        : {}),
    },
    args.intent,
  );
}
