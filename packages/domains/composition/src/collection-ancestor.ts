import type { PageComposition } from "@repo/contracts-zod";

/**
 * Returns the nearest `primitive.collection` ancestor node id, or null if none.
 */
export function findNearestCollectionAncestorNodeId(
  composition: PageComposition,
  nodeId: string,
): string | null {
  let cur = composition.nodes[nodeId];
  while (cur?.parentId) {
    const parent = composition.nodes[cur.parentId];
    if (!parent) {
      return null;
    }
    if (parent.definitionKey === "primitive.collection") {
      return parent.id;
    }
    cur = parent;
  }
  return null;
}
