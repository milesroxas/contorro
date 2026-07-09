import type { AsyncResult, PageComposition } from "@repo/contracts-zod";

export type StudioCompositionRevision = {
  updatedAt: string;
};

/** Metadata fields the studio may PATCH without resubmitting the tree. */
export type UpdateCompositionMetaPatch = {
  name?: string;
  blockType?: string | null;
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

  /**
   * Updates title/displayName and/or blockType — never resubmits the
   * composition. `blockType` applies to components only (`null` clears it).
   */
  updateMeta(
    compositionId: string,
    patch: UpdateCompositionMetaPatch,
    intent: "draft" | "publish",
  ): AsyncResult<
    {
      name: string;
      updatedAt: string;
      blockType?: string | null;
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
