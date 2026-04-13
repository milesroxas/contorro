import { z } from "zod";
import { OverrideValueSchema } from "./design-system.js";
import { StylePropertySchema } from "./style-properties.js";

const TokenStylePropertySchema = z.object({
  type: z.literal("token"),
  property: StylePropertySchema,
  token: z.string(),
});

const OverrideStylePropertySchema = z.object({
  type: z.literal("override"),
  property: StylePropertySchema,
  value: OverrideValueSchema,
});

export const StyleBindingSchema = z.object({
  id: z.string(),
  nodeId: z.string(),
  properties: z.array(
    z.union([TokenStylePropertySchema, OverrideStylePropertySchema]),
  ),
});

export type TokenStyleProperty = z.infer<typeof TokenStylePropertySchema>;
export type OverrideStyleProperty = z.infer<typeof OverrideStylePropertySchema>;
export type StylePropertyEntry = TokenStyleProperty | OverrideStyleProperty;
export type StyleOverrideValue = z.infer<typeof OverrideValueSchema>;
export type StyleBinding = z.infer<typeof StyleBindingSchema>;
