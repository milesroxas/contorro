import { z } from "zod";

import { LegacySlotContractSchema } from "./composition.js";
import {
  EditorFieldSpecSchema,
  type EditorFieldsContract,
  EditorFieldsContractSchema,
} from "./editor-fields.js";

const zLegacySlotsShape = z.object({
  slots: z.array(EditorFieldSpecSchema),
});

/**
 * Coerces stored JSON (v0.4 `{ editorFields }`, legacy `{ slots }`, or legacy maxNodes map)
 * to `{ editorFields: EditorFieldSpec[] }`.
 */
export function normalizeEditorFieldsContract(
  raw: unknown,
): EditorFieldsContract {
  const ed = EditorFieldsContractSchema.safeParse(raw);
  if (ed.success) {
    return ed.data;
  }
  const legacy = zLegacySlotsShape.safeParse(raw);
  if (legacy.success) {
    return { editorFields: legacy.data.slots };
  }
  const leg = LegacySlotContractSchema.safeParse(raw);
  if (leg.success) {
    return { editorFields: [] };
  }
  return { editorFields: [] };
}

/**
 * Strict parse for persistence: rejects unknown shapes (use after defaulting null to `{ editorFields: [] }`).
 */
export function parseEditorFieldsContract(
  raw: unknown,
): { ok: true; data: EditorFieldsContract } | { ok: false } {
  const ed = EditorFieldsContractSchema.safeParse(raw);
  if (ed.success) {
    return { ok: true, data: ed.data };
  }
  const legacy = zLegacySlotsShape.safeParse(raw);
  if (legacy.success) {
    return { ok: true, data: { editorFields: legacy.data.slots } };
  }
  const leg = LegacySlotContractSchema.safeParse(raw);
  if (leg.success) {
    return { ok: true, data: { editorFields: [] } };
  }
  return { ok: false };
}
