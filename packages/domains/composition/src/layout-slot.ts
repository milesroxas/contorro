import type { CompositionNode, PageComposition } from "@repo/contracts-zod";

/** Default layout slot id when `propValues.slotId` is missing or blank. */
export const DEFAULT_LAYOUT_SLOT_ID = "main";

export function normalizedLayoutSlotId(node: CompositionNode): string {
  const raw = node.propValues?.slotId;
  if (typeof raw === "string" && raw.trim() !== "") {
    return raw.trim();
  }
  return DEFAULT_LAYOUT_SLOT_ID;
}

/** True if the page template tree includes at least one layout slot (page blocks mount here). */
export function compositionUsesLayoutSlots(
  composition: PageComposition,
): boolean {
  for (const node of Object.values(composition.nodes)) {
    if (node.definitionKey === "primitive.slot") {
      return true;
    }
  }
  return false;
}

export function collectLayoutSlotIds(
  composition: PageComposition,
): Set<string> {
  const ids = new Set<string>();
  for (const node of Object.values(composition.nodes)) {
    if (node.definitionKey === "primitive.slot") {
      ids.add(normalizedLayoutSlotId(node));
    }
  }
  return ids;
}

/**
 * Slot ids in document-tree order (depth-first), first occurrence wins (templates enforce uniqueness).
 */
export function orderedLayoutSlotIds(composition: PageComposition): string[] {
  const out: string[] = [];
  const seen = new Set<string>();

  function walk(id: string): void {
    const node = composition.nodes[id];
    if (!node) {
      return;
    }
    if (node.definitionKey === "primitive.slot") {
      const sid = normalizedLayoutSlotId(node);
      if (!seen.has(sid)) {
        seen.add(sid);
        out.push(sid);
      }
    }
    for (const c of node.childIds) {
      walk(c);
    }
  }

  walk(composition.rootId);
  return out;
}
