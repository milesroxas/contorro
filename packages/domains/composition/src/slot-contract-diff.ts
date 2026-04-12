import type { SlotDefinition } from "@repo/contracts-zod";

export type SlotContractBreakingReason =
  | "slot_removed"
  | "slot_type_changed"
  | "became_required_without_default";

function indexSlots(slots: SlotDefinition[]): Map<string, SlotDefinition> {
  const m = new Map<string, SlotDefinition>();
  for (const s of slots) {
    m.set(s.name, s);
  }
  return m;
}

/**
 * Breaking changes when republishing (v0.4). First publish (no previous slots) is non-breaking.
 */
export function slotContractBreakingChanges(
  previous: SlotDefinition[] | undefined,
  next: SlotDefinition[] | undefined,
): SlotContractBreakingReason[] {
  const prevArr = previous ?? [];
  const nextArr = next ?? [];

  if (prevArr.length === 0) {
    return [];
  }

  if (nextArr.length === 0) {
    return ["slot_removed"];
  }

  const prev = indexSlots(prevArr);
  const nxt = indexSlots(nextArr);
  const reasons: SlotContractBreakingReason[] = [];

  for (const [name, p] of prev) {
    const q = nxt.get(name);
    if (!q) {
      reasons.push("slot_removed");
      continue;
    }
    if (p.type !== q.type) {
      reasons.push("slot_type_changed");
    }
    if (!p.required && q.required && q.defaultValue === undefined) {
      reasons.push("became_required_without_default");
    }
  }

  return reasons;
}
