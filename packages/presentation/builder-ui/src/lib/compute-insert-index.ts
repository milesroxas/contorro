import type { PageComposition } from "@repo/contracts-zod";

/**
 * Maps a UI slot index (0..n for n children) to the insert index passed to
 * `moveNode` / `addChildNode` after accounting for dragging a sibling.
 */
export function computeInsertIndex(
  composition: PageComposition,
  parentId: string,
  slotIndex: number,
  draggedNodeId: string | null,
): number {
  const parent = composition.nodes[parentId];
  if (!parent) {
    return 0;
  }
  const ids = parent.childIds;
  const maxSlot = ids.length;
  const boundedSlot = Math.min(Math.max(0, slotIndex), maxSlot);

  if (!draggedNodeId || !ids.includes(draggedNodeId)) {
    return Math.min(boundedSlot, ids.length);
  }

  const oldPos = ids.indexOf(draggedNodeId);
  if (boundedSlot <= oldPos) {
    return Math.min(boundedSlot, ids.length - 1);
  }
  return Math.min(boundedSlot - 1, ids.length - 1);
}
