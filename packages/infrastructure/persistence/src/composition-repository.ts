import type { PageComposition } from "@repo/contracts-zod";
import { PageCompositionSchema } from "@repo/contracts-zod";
import type { CompositionRepository } from "@repo/domains-composition";
import type { Payload } from "payload";

/**
 * Maps `page-compositions` Payload documents to {@link PageComposition}.
 */
export class PayloadCompositionRepository implements CompositionRepository {
  constructor(private readonly payload: Payload) {}

  async findById(id: string): Promise<PageComposition | null> {
    try {
      const doc = await this.payload.findByID({
        collection: "page-compositions",
        id,
        depth: 0,
      });
      if (!doc || typeof doc !== "object" || !("composition" in doc)) {
        return null;
      }
      const raw = (doc as { composition?: unknown }).composition;
      const parsed = PageCompositionSchema.safeParse(raw);
      return parsed.success ? parsed.data : null;
    } catch {
      return null;
    }
  }
}
