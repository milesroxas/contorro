import { type AsyncResult, err } from "@repo/contracts-zod";

import type { StudioMutationRepository } from "./studio-mutation-repository.js";

export type RenameTemplateError =
  | "COMPOSITION_NOT_FOUND"
  | "PERSISTENCE_ERROR"
  | "FORBIDDEN"
  | "VALIDATION_ERROR";

export async function renameTemplateCommand(
  repo: StudioMutationRepository,
  args: {
    compositionId: string;
    name: string;
    intent: "draft" | "publish";
  },
): AsyncResult<
  { name: string; updatedAt: string; _status?: "draft" | "published" | null },
  RenameTemplateError
> {
  const name = args.name.trim();
  if (name === "") {
    return err("VALIDATION_ERROR");
  }
  const existing = await repo.loadRevision(args.compositionId);
  if (!existing) {
    return err("COMPOSITION_NOT_FOUND");
  }
  return repo.renameTemplate(args.compositionId, name, args.intent);
}
