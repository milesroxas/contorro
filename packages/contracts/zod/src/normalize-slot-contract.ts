import { LegacySlotContractSchema } from "./composition.js";
import type { SlotDefinition } from "./slot-editor.js";
import { EditorSlotContractSchema } from "./slot-editor.js";

/**
 * Coerces stored JSON (v0.4 editor array or legacy maxNodes map) to `{ slots: SlotDefinition[] }`.
 */
export function normalizeSlotContract(raw: unknown): {
  slots: SlotDefinition[];
} {
  const ed = EditorSlotContractSchema.safeParse(raw);
  if (ed.success) {
    return ed.data;
  }
  const leg = LegacySlotContractSchema.safeParse(raw);
  if (leg.success) {
    return { slots: [] };
  }
  return { slots: [] };
}

/**
 * Strict parse for persistence: rejects unknown shapes (use after defaulting null to `{ slots: [] }`).
 */
export function parseEditorSlotContract(
  raw: unknown,
): { ok: true; data: { slots: SlotDefinition[] } } | { ok: false } {
  const ed = EditorSlotContractSchema.safeParse(raw);
  if (ed.success) {
    return { ok: true, data: ed.data };
  }
  const leg = LegacySlotContractSchema.safeParse(raw);
  if (leg.success) {
    return { ok: true, data: { slots: [] } };
  }
  return { ok: false };
}
