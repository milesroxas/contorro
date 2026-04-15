import type { PageComposition } from "@repo/contracts-zod";
import { PageCompositionSchema } from "@repo/contracts-zod";
import type { CompositionActor } from "@repo/domains-composition";
import { validatePageCompositionInvariants } from "@repo/domains-composition";
import { type AsyncResult, err } from "@repo/kernel";

import type { StudioMutationRepository } from "../ports/studio-mutation-repository.js";

export type SaveCompositionError =
  | "COMPOSITION_NOT_FOUND"
  | "COMPOSITION_CONFLICT"
  | "PERSISTENCE_ERROR"
  | "FORBIDDEN"
  | "VALIDATION_ERROR";

export async function saveCompositionCommand(
  repo: StudioMutationRepository,
  args: {
    compositionId: string;
    composition: PageComposition;
    ifMatchUpdatedAt: string | null | undefined;
    intent: "draft" | "publish";
    actor: CompositionActor;
  },
): AsyncResult<
  { updatedAt: string; _status: "draft" | "published" | null },
  SaveCompositionError
> {
  const parsed = PageCompositionSchema.safeParse(args.composition);
  if (!parsed.success) {
    return err("VALIDATION_ERROR");
  }
  const inv = validatePageCompositionInvariants(parsed.data);
  if (!inv.ok) {
    return err("VALIDATION_ERROR");
  }

  const existing = await repo.loadRevision(args.compositionId, args.actor);
  if (!existing) {
    return err("COMPOSITION_NOT_FOUND");
  }
  if (
    args.ifMatchUpdatedAt != null &&
    args.ifMatchUpdatedAt !== existing.updatedAt
  ) {
    return err("COMPOSITION_CONFLICT");
  }

  return repo.save(args.compositionId, parsed.data, args.intent, args.actor);
}
