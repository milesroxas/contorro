import {
  type EditorFieldsContract,
  type PropContract,
  PropContractSchema,
  parseEditorFieldsContract,
} from "@repo/contracts-zod";
import { err, ok, type Result } from "@repo/kernel";

export type ParseContractImportError = "VALIDATION_ERROR";

/** Validates optional JSON bodies for POST …/contracts/components/:key/schema (Phase 5). */
export function parsePropEditorFieldsImport(
  raw: unknown,
): Result<
  { propContract?: PropContract; editorFields?: EditorFieldsContract },
  ParseContractImportError
> {
  if (typeof raw !== "object" || raw === null) {
    return err("VALIDATION_ERROR");
  }
  const o = raw as Record<string, unknown>;
  let propContract: PropContract | undefined;
  let editorFields: EditorFieldsContract | undefined;
  if ("propContract" in o && o.propContract !== undefined) {
    const p = PropContractSchema.safeParse(o.propContract);
    if (!p.success) {
      return err("VALIDATION_ERROR");
    }
    propContract = p.data;
  }
  const rawEditor = o.editorFields ?? o.slotContract;
  if (rawEditor !== undefined) {
    const s = parseEditorFieldsContract(rawEditor);
    if (!s.ok) {
      return err("VALIDATION_ERROR");
    }
    editorFields = s.data;
  }
  if (propContract === undefined && editorFields === undefined) {
    return err("VALIDATION_ERROR");
  }
  return ok({ propContract, editorFields });
}
