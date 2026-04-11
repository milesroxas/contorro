import type {
  CompositionActor,
  CompositionRepository,
  LoadedComposition,
} from "@repo/domains-composition";

export async function getCompositionQuery(
  repo: CompositionRepository,
  args: { compositionId: string; actor: CompositionActor },
): Promise<LoadedComposition | null> {
  return repo.load(args.compositionId, args.actor);
}
