import { PropContractSchema } from "@repo/contracts-zod";
import { z } from "zod";

/** JSON Schema 2020-12 for {@link PropContractSchema} (Phase 2 test gate). */
export function propContractToJsonSchema2020(): Record<string, unknown> {
  return z.toJSONSchema(PropContractSchema) as Record<string, unknown>;
}
