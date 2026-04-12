import type { PageComposition } from "@repo/contracts-zod";
import { PageCompositionSchema } from "@repo/contracts-zod";

const EMPTY_ROOT_ID = "empty-root";

/**
 * Minimal valid tree for a component that has not yet received a `composition` document
 * (admin can open the builder and save).
 */
export function defaultEmptyPageComposition(): PageComposition {
  return PageCompositionSchema.parse({
    rootId: EMPTY_ROOT_ID,
    nodes: {
      [EMPTY_ROOT_ID]: {
        id: EMPTY_ROOT_ID,
        kind: "primitive",
        definitionKey: "primitive.box",
        parentId: null,
        childIds: [],
      },
    },
    styleBindings: {},
  });
}
