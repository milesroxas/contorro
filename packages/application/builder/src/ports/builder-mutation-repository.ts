import type { PageComposition } from "@repo/contracts-zod";
import type { AsyncResult } from "@repo/kernel";

import type { CompositionActor } from "@repo/domains-composition";

export type BuilderCompositionRevision = {
  updatedAt: string;
};

export interface BuilderMutationRepository {
  loadRevision(
    compositionId: string,
    actor: CompositionActor,
  ): Promise<BuilderCompositionRevision | null>;

  save(
    compositionId: string,
    composition: PageComposition,
    intent: "draft" | "publish",
    actor: CompositionActor,
  ): AsyncResult<{ updatedAt: string }, "PERSISTENCE_ERROR" | "FORBIDDEN">;

  renameTemplate(
    compositionId: string,
    name: string,
    actor: CompositionActor,
  ): AsyncResult<
    { name: string; updatedAt: string },
    "PERSISTENCE_ERROR" | "FORBIDDEN"
  >;

  createTemplate(
    title: string,
    actor: CompositionActor,
  ): AsyncResult<{ compositionId: string }, "PERSISTENCE_ERROR" | "FORBIDDEN">;

  createComponent(
    title: string,
    actor: CompositionActor,
  ): AsyncResult<{ compositionId: string }, "PERSISTENCE_ERROR" | "FORBIDDEN">;
}
