import { DEFAULT_LAYOUT_SLOT_ID } from "./layout-slot.js";

type ContentSlotRow = {
  slotId?: unknown;
  blocks?: unknown;
};

function trimSlotId(raw: unknown): string {
  if (typeof raw !== "string" || raw.trim() === "") {
    return DEFAULT_LAYOUT_SLOT_ID;
  }
  return raw.trim();
}

function normalizedBlocksFromRow(
  blocksRaw: unknown,
): Record<string, unknown>[] {
  if (!Array.isArray(blocksRaw)) {
    return [];
  }
  const chunk: Record<string, unknown>[] = [];
  for (const b of blocksRaw) {
    if (!b || typeof b !== "object" || Array.isArray(b)) {
      continue;
    }
    const o = b as Record<string, unknown>;
    const { layoutSlotId: _ls, ...rest } = o;
    chunk.push(rest);
  }
  return chunk;
}

/**
 * Aligns page `contentSlots` rows to the template’s slot order. Merges blocks by `slotId`
 * (and strips legacy per-block `layoutSlotId`). Blocks in slots absent from the new order
 * are never dropped: they are appended to the FIRST slot row (the renderer treats unknown
 * slots as `main` anyway). Used by the Pages `beforeValidate` hook.
 */
export function mergePageContentSlotsToSlotOrder(
  slotOrder: string[],
  rawSlots: unknown,
): { slotId: string; blocks: Record<string, unknown>[] }[] {
  const mergedBlocks = new Map<string, Record<string, unknown>[]>();
  const orphanBlocks: Record<string, unknown>[] = [];
  const known = new Set(slotOrder);

  if (Array.isArray(rawSlots)) {
    for (const row of rawSlots as ContentSlotRow[]) {
      if (!row || typeof row !== "object") {
        continue;
      }
      const sid = trimSlotId(row.slotId);
      const chunk = normalizedBlocksFromRow(row.blocks);
      if (known.has(sid)) {
        const prev = mergedBlocks.get(sid) ?? [];
        mergedBlocks.set(sid, [...prev, ...chunk]);
      } else {
        orphanBlocks.push(...chunk);
      }
    }
  }

  return slotOrder.map((slotId, index) => ({
    slotId,
    blocks:
      index === 0
        ? [...(mergedBlocks.get(slotId) ?? []), ...orphanBlocks]
        : (mergedBlocks.get(slotId) ?? []),
  }));
}
