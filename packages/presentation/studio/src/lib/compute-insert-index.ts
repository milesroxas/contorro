import type { PageComposition } from "@repo/contracts-zod";

/**
 * Maps a UI insertion index (0..n for n children) to the index passed to
 * `moveNode` / `addChildNode` after accounting for dragging a sibling.
 */
export function computeInsertIndex(
  composition: PageComposition,
  parentId: string,
  insertIndex: number,
  draggedNodeId: string | null,
): number {
  const parent = composition.nodes[parentId];
  if (!parent) {
    return 0;
  }
  const ids = parent.childIds;
  const maxInsert = ids.length;
  const bounded = Math.min(Math.max(0, insertIndex), maxInsert);

  if (!draggedNodeId || !ids.includes(draggedNodeId)) {
    return Math.min(bounded, ids.length);
  }

  const oldPos = ids.indexOf(draggedNodeId);
  if (bounded <= oldPos) {
    return Math.min(bounded, ids.length - 1);
  }
  return Math.min(bounded - 1, ids.length - 1);
}
