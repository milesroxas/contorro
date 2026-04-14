import type { PageComposition } from "@repo/contracts-zod";
import { PageCompositionSchema } from "@repo/contracts-zod";
import type {
  CompositionActor,
  CompositionRepository,
  LoadedComposition,
} from "@repo/domains-composition";
import { type AsyncResult, err, ok } from "@repo/kernel";
import { eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import * as studioSchema from "./schema/studio.js";

type StudioDb = NodePgDatabase<typeof studioSchema>;

/**
 * Reads/writes `builder.compositions` (v0.4). Access control matches Payload:
 * forbidden updates surface as FORBIDDEN when the DB role cannot write (RLS future).
 */
export class DrizzleCompositionRepository implements CompositionRepository {
  constructor(private readonly db: StudioDb) {}

  async load(
    id: string,
    actor: CompositionActor,
  ): Promise<LoadedComposition | null> {
    void actor;
    const rows = await this.db
      .select()
      .from(studioSchema.studioCompositions)
      .where(eq(studioSchema.studioCompositions.id, id))
      .limit(1);
    const row = rows[0];
    if (!row) {
      return null;
    }
    const parsed = PageCompositionSchema.safeParse(row.composition);
    if (!parsed.success) {
      return null;
    }
    return {
      composition: parsed.data,
      updatedAt:
        typeof row.updatedAt === "string"
          ? row.updatedAt
          : new Date().toISOString(),
    };
  }

  async saveDraft(
    id: string,
    composition: PageComposition,
    actor: CompositionActor,
  ): AsyncResult<{ updatedAt: string }, "PERSISTENCE_ERROR" | "FORBIDDEN"> {
    void actor;
    const now = new Date().toISOString();
    try {
      const updated = await this.db
        .update(studioSchema.studioCompositions)
        .set({
          composition,
          updatedAt: now,
        })
        .where(eq(studioSchema.studioCompositions.id, id))
        .returning({ updatedAt: studioSchema.studioCompositions.updatedAt });
      const u = updated[0];
      if (!u) {
        return err("PERSISTENCE_ERROR");
      }
      return ok({
        updatedAt:
          typeof u.updatedAt === "string" ? u.updatedAt : String(u.updatedAt),
      });
    } catch {
      return err("PERSISTENCE_ERROR");
    }
  }
}
