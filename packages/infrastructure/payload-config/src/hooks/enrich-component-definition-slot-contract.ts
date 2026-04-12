import { PageCompositionSchema } from "@repo/contracts-zod";
import { editorSlotContractFromComposition } from "@repo/domains-composition";
import type { CollectionAfterReadHook } from "payload";

/**
 * `composition` is the canonical source for editor slots; align `slotContract` on reads
 * so REST/admin match the builder without relying on a backfill migration.
 */
export const enrichComponentDefinitionSlotContractAfterRead: CollectionAfterReadHook =
  ({ doc }) => {
    if (!doc || typeof doc !== "object") {
      return doc;
    }
    const row = doc as { composition?: unknown };
    if (row.composition === undefined || row.composition === null) {
      return doc;
    }
    const comp = PageCompositionSchema.safeParse(row.composition);
    if (!comp.success) {
      return doc;
    }
    return {
      ...doc,
      slotContract: editorSlotContractFromComposition(comp.data),
    };
  };
