import { z } from "zod";
import { OverrideValueSchema } from "./design-system.js";

const TokenStylePropertySchema = z.object({
  type: z.literal("token"),
  property: z.string(),
  token: z.string(),
});

const OverrideStylePropertySchema = z.object({
  type: z.literal("override"),
  property: z.string(),
  value: OverrideValueSchema,
});

export const StyleBindingSchema = z.object({
  id: z.string(),
  nodeId: z.string(),
  properties: z.array(
    z.union([TokenStylePropertySchema, OverrideStylePropertySchema]),
  ),
});

export type StyleBinding = z.infer<typeof StyleBindingSchema>;
