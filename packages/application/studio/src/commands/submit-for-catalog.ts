import type { CompositionActor } from "@repo/domains-composition";
import { type AsyncResult, err, ok } from "@repo/kernel";

export type SubmitForCatalogError =
  | "COMPOSITION_NOT_FOUND"
  | "FORBIDDEN"
  | "PERSISTENCE_ERROR";

/** Records catalog review intent on the page-composition document (§3 diagram — submit for catalog). */
export async function submitForCatalogCommand(
  deps: {
    trySubmit: (
      compositionId: string,
      actor: CompositionActor,
    ) => Promise<
      | { ok: true; submittedAt: string }
      | { ok: false; error: SubmitForCatalogError }
    >;
  },
  args: { compositionId: string; actor: CompositionActor },
): AsyncResult<{ accepted: true; submittedAt: string }, SubmitForCatalogError> {
  const r = await deps.trySubmit(args.compositionId, args.actor);
  if (r.ok) {
    return ok({ accepted: true, submittedAt: r.submittedAt });
  }
  return err(r.error);
}
