import {
  type PageComposition,
  PageCompositionSchema,
} from "@repo/contracts-zod";

/** Minimal valid tree for a new editor page (matches local seed shape). */
export const BLANK_STACK_PAGE_COMPOSITION: PageComposition =
  PageCompositionSchema.parse({
    rootId: "stack-root",
    nodes: {
      "stack-root": {
        id: "stack-root",
        kind: "primitive",
        definitionKey: "primitive.stack",
        parentId: null,
        childIds: [],
        propValues: {
          direction: "column",
          gap: "8px",
          align: "stretch",
          justify: "flex-start",
        },
      },
    },
    styleBindings: {},
  });
