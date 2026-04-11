import type { PageComposition } from "@repo/contracts-zod";
import type { AsyncResult } from "@repo/kernel";

export type LoadedComposition = {
  composition: PageComposition;
  /** ISO string from Payload `updatedAt` */
  updatedAt: string;
};

/**
 * Authenticated principal for persistence access control.
 * Gateway supplies the `user` from `payload.auth()` (Payload `TypedUser`).
 */
export type CompositionActor = unknown;

export interface CompositionRepository {
  load(id: string, actor: CompositionActor): Promise<LoadedComposition | null>;

  saveDraft(
    id: string,
    composition: PageComposition,
    actor: CompositionActor,
  ): AsyncResult<{ updatedAt: string }, "PERSISTENCE_ERROR" | "FORBIDDEN">;
}
