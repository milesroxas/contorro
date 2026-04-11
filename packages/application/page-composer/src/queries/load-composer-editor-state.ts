import type {
  CompositionActor,
  CompositionRepository,
  LoadedComposition,
} from "@repo/domains-composition";
import { type AsyncResult, err, ok } from "@repo/kernel";

/** Payload `pages` row fields needed to load the linked composition (Phase 4 editor surface). */
export type ComposerPageSummary = {
  id: string;
  title: string;
  slug: string;
  compositionDocumentId: string;
};

export type ComposerEditorState = ComposerPageSummary & {
  composition: LoadedComposition["composition"];
  updatedAt: string;
};

/**
 * Editor surface: resolves the page-compositions document and returns validated tree data.
 * Callers supply `page` from Payload; persistence access control uses `actor` (gateway).
 */
export async function loadComposerEditorStateQuery(
  repo: CompositionRepository,
  args: { page: ComposerPageSummary; actor: CompositionActor },
): AsyncResult<ComposerEditorState, "COMPOSITION_NOT_FOUND"> {
  const loaded = await repo.load(args.page.compositionDocumentId, args.actor);
  if (!loaded) {
    return err("COMPOSITION_NOT_FOUND");
  }
  return ok({
    ...args.page,
    composition: loaded.composition,
    updatedAt: loaded.updatedAt,
  });
}
