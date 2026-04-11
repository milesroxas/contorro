import {
  type PropContract,
  PropContractSchema,
  type SlotContract,
  SlotContractSchema,
} from "@repo/contracts-zod";
import { type Result, err, ok } from "@repo/kernel";

export type ParseContractImportError = "VALIDATION_ERROR";

/** Validates optional JSON bodies for POST …/contracts/components/:key/schema (Phase 5). */
export function parsePropSlotContractImport(
  raw: unknown,
): Result<
  { propContract?: PropContract; slotContract?: SlotContract },
  ParseContractImportError
> {
  if (typeof raw !== "object" || raw === null) {
    return err("VALIDATION_ERROR");
  }
  const o = raw as Record<string, unknown>;
  let propContract: PropContract | undefined;
  let slotContract: SlotContract | undefined;
  if ("propContract" in o && o.propContract !== undefined) {
    const p = PropContractSchema.safeParse(o.propContract);
    if (!p.success) {
      return err("VALIDATION_ERROR");
    }
    propContract = p.data;
  }
  if ("slotContract" in o && o.slotContract !== undefined) {
    const s = SlotContractSchema.safeParse(o.slotContract);
    if (!s.success) {
      return err("VALIDATION_ERROR");
    }
    slotContract = s.data;
  }
  if (propContract === undefined && slotContract === undefined) {
    return err("VALIDATION_ERROR");
  }
  return ok({ propContract, slotContract });
}
