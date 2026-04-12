import { PageCompositionSchema } from "@repo/contracts-zod";
import { editorFieldsContractFromComposition } from "@repo/domains-composition";
import type { CollectionAfterReadHook } from "payload";

/**
 * `composition` is the canonical source for CMS editor fields; align `editorFields` on reads
 * so REST/admin match the builder without relying on a backfill migration.
 */
export const enrichComponentsEditorFieldsAfterRead: CollectionAfterReadHook = ({
  doc,
}) => {
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
    editorFields: editorFieldsContractFromComposition(comp.data),
  };
};
