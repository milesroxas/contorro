import {
  type EditorSlotContract,
  type PropContract,
  PropContractSchema,
  parseEditorSlotContract,
} from "@repo/contracts-zod";
import { type Result, err, ok } from "@repo/kernel";

export type ParseContractImportError = "VALIDATION_ERROR";

/** Validates optional JSON bodies for POST …/contracts/components/:key/schema (Phase 5). */
export function parsePropSlotContractImport(
  raw: unknown,
): Result<
  { propContract?: PropContract; slotContract?: EditorSlotContract },
  ParseContractImportError
> {
  if (typeof raw !== "object" || raw === null) {
    return err("VALIDATION_ERROR");
  }
  const o = raw as Record<string, unknown>;
  let propContract: PropContract | undefined;
  let slotContract: EditorSlotContract | undefined;
  if ("propContract" in o && o.propContract !== undefined) {
    const p = PropContractSchema.safeParse(o.propContract);
    if (!p.success) {
      return err("VALIDATION_ERROR");
    }
    propContract = p.data;
  }
  if ("slotContract" in o && o.slotContract !== undefined) {
    const s = parseEditorSlotContract(o.slotContract);
    if (!s.ok) {
      return err("VALIDATION_ERROR");
    }
    slotContract = s.data;
  }
  if (propContract === undefined && slotContract === undefined) {
    return err("VALIDATION_ERROR");
  }
  return ok({ propContract, slotContract });
}
