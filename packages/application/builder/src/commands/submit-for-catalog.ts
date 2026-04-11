import type { CompositionActor } from "@repo/domains-composition";
import { type AsyncResult, err } from "@repo/kernel";

/** Deferred to Phase 5+ publishing workflow; gateway returns 501. */
export async function submitForCatalogCommand(_args: {
  compositionId: string;
  actor: CompositionActor;
}): AsyncResult<{ accepted: true }, "NOT_IMPLEMENTED"> {
  return err("NOT_IMPLEMENTED");
}
