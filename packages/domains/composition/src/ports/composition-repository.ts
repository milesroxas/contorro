import type { PageComposition } from "@repo/contracts-zod";

export interface CompositionRepository {
  findById(id: string): Promise<PageComposition | null>;
}
