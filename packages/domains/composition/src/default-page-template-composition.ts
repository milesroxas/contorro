import type { PageComposition } from "@repo/contracts-zod";
import { PageCompositionSchema } from "@repo/contracts-zod";

/**
 * Default page template shell for new template entries:
 * root container with top-level header/main/footer regions.
 */
export function defaultPageTemplateComposition(): PageComposition {
  return PageCompositionSchema.parse({
    rootId: "page-root",
    nodes: {
      "page-root": {
        id: "page-root",
        kind: "primitive",
        definitionKey: "primitive.box",
        parentId: null,
        childIds: ["page-header", "page-main", "page-footer"],
        propValues: { tag: "div" },
      },
      "page-header": {
        id: "page-header",
        kind: "primitive",
        definitionKey: "primitive.box",
        parentId: "page-root",
        childIds: [],
        propValues: { tag: "header" },
      },
      "page-main": {
        id: "page-main",
        kind: "primitive",
        definitionKey: "primitive.box",
        parentId: "page-root",
        childIds: ["page-main-slot"],
        propValues: { tag: "main" },
      },
      "page-main-slot": {
        id: "page-main-slot",
        kind: "slot",
        definitionKey: "primitive.slot",
        parentId: "page-main",
        childIds: [],
        propValues: { slotId: "main" },
      },
      "page-footer": {
        id: "page-footer",
        kind: "primitive",
        definitionKey: "primitive.box",
        parentId: "page-root",
        childIds: [],
        propValues: { tag: "footer" },
      },
    },
    styleBindings: {},
  });
}
