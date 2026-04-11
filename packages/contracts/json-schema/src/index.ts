import { PropContractSchema, SlotContractSchema } from "@repo/contracts-zod";
import { z } from "zod";

/** JSON Schema 2020-12 for {@link PropContractSchema} (Phase 2 test gate). */
export function propContractToJsonSchema2020(): Record<string, unknown> {
  return z.toJSONSchema(PropContractSchema) as Record<string, unknown>;
}

/** JSON Schema 2020-12 for {@link SlotContractSchema}. */
export function slotContractToJsonSchema2020(): Record<string, unknown> {
  return z.toJSONSchema(SlotContractSchema) as Record<string, unknown>;
}
