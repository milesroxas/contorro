import type { AsyncResult, PageComposition } from "@repo/contracts-zod";

export type StudioCompositionRevision = {
  updatedAt: string;
};

export interface StudioMutationRepository {
  loadRevision(
    compositionId: string,
  ): Promise<StudioCompositionRevision | null>;

  /**
   * Persist the composition. When `ifMatchUpdatedAt` is provided the write is
   * a single conditional update (`where: { updatedAt }`) so the conflict check
   * and the write cannot race.
   */
  save(
    compositionId: string,
    composition: PageComposition,
    intent: "draft" | "publish",
    ifMatchUpdatedAt: string | null,
  ): AsyncResult<
    { updatedAt: string; _status: "draft" | "published" | null },
    | "PERSISTENCE_ERROR"
    | "FORBIDDEN"
    | "COMPOSITION_CONFLICT"
    | "COMPOSITION_NOT_FOUND"
  >;

  /** Updates the title/displayName only — never resubmits the composition. */
  renameTemplate(
    compositionId: string,
    name: string,
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
  ): AsyncResult<{ compositionId: string }, "PERSISTENCE_ERROR" | "FORBIDDEN">;

  createComponent(
    title: string,
  ): AsyncResult<{ compositionId: string }, "PERSISTENCE_ERROR" | "FORBIDDEN">;
}
