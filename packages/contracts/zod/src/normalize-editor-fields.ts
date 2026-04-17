import {
  type EditorFieldsContract,
  EditorFieldsContractSchema,
} from "./editor-fields.js";

/**
 * Coerces stored JSON to `{ editorFields }`. Unknown shapes default to empty fields.
 */
export function normalizeEditorFieldsContract(
  raw: unknown,
): EditorFieldsContract {
  const ed = EditorFieldsContractSchema.safeParse(raw);
  if (ed.success) {
    return ed.data;
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
  return { ok: false };
}
