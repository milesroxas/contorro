import type { PageComposition } from "@repo/contracts-zod";
import type { CompositionActor } from "@repo/domains-composition";
import type { AsyncResult } from "@repo/kernel";

export type StudioCompositionRevision = {
  updatedAt: string;
};

export interface StudioMutationRepository {
  loadRevision(
    compositionId: string,
    actor: CompositionActor,
  ): Promise<StudioCompositionRevision | null>;

  save(
    compositionId: string,
    composition: PageComposition,
    intent: "draft" | "publish",
    actor: CompositionActor,
  ): AsyncResult<
    { updatedAt: string; _status: "draft" | "published" | null },
    "PERSISTENCE_ERROR" | "FORBIDDEN"
  >;

  renameTemplate(
    compositionId: string,
    name: string,
    actor: CompositionActor,
    intent: "draft" | "publish",
  ): AsyncResult<
    {
      name: string;
      updatedAt: string;
      _status?: "draft" | "published" | null;
    },
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
