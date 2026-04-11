import type { PageComposition } from "@repo/contracts-zod";
import { PageCompositionSchema } from "@repo/contracts-zod";
import type {
  CompositionActor,
  CompositionRepository,
  LoadedComposition,
} from "@repo/domains-composition";
import { type AsyncResult, err, ok } from "@repo/kernel";
import type { Payload, TypedUser } from "payload";

function readUpdatedAtIso(doc: unknown): string {
  if (doc && typeof doc === "object" && "updatedAt" in doc) {
    const u = (doc as { updatedAt?: unknown }).updatedAt;
    if (typeof u === "string") {
      return u;
    }
  }
  return new Date().toISOString();
}

/**
 * Maps `page-compositions` Payload documents to {@link PageComposition}.
 */
export class PayloadCompositionRepository implements CompositionRepository {
  constructor(private readonly payload: Payload) {}

  async load(
    id: string,
    actor: CompositionActor,
  ): Promise<LoadedComposition | null> {
    const user = actor as TypedUser;
    try {
      const doc = await this.payload.findByID({
        collection: "page-compositions",
        id,
        depth: 0,
        draft: true,
        user,
        overrideAccess: false,
      });
      if (!doc || typeof doc !== "object" || !("composition" in doc)) {
        return null;
      }
      const raw = (doc as { composition?: unknown }).composition;
      const parsed = PageCompositionSchema.safeParse(raw);
      if (!parsed.success) {
        return null;
      }
      return { composition: parsed.data, updatedAt: readUpdatedAtIso(doc) };
    } catch {
      return null;
    }
  }

  async saveDraft(
    id: string,
    composition: PageComposition,
    actor: CompositionActor,
  ): AsyncResult<{ updatedAt: string }, "PERSISTENCE_ERROR" | "FORBIDDEN"> {
    const user = actor as TypedUser;
    try {
      const doc = await this.payload.update({
        collection: "page-compositions",
        id,
        data: {
          composition,
        },
        draft: true,
        user,
        overrideAccess: false,
      });
      const updatedAt = readUpdatedAtIso(doc);
      return ok({ updatedAt });
    } catch (e) {
      const name =
        typeof e === "object" && e !== null && "name" in e
          ? String((e as { name: unknown }).name)
          : "";
      if (name === "Forbidden" || name === "ForbiddenError") {
        return err("FORBIDDEN");
      }
      return err("PERSISTENCE_ERROR");
    }
  }
}
