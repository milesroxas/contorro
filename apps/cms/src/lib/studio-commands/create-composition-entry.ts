import { type AsyncResult, err } from "@repo/contracts-zod";
import type { CompositionActor } from "@repo/domains-composition";

import type { StudioMutationRepository } from "./studio-mutation-repository.js";

export type CreateCompositionEntryError =
  | "PERSISTENCE_ERROR"
  | "FORBIDDEN"
  | "VALIDATION_ERROR";

export async function createCompositionEntryCommand(
  repo: StudioMutationRepository,
  args: {
    kind: "template" | "component";
    title: string;
    actor: CompositionActor;
  },
): AsyncResult<{ compositionId: string }, CreateCompositionEntryError> {
  const title = args.title.trim();
  if (title === "") {
    return err("VALIDATION_ERROR");
  }
  return args.kind === "component"
    ? repo.createComponent(title, args.actor)
    : repo.createTemplate(title, args.actor);
}
