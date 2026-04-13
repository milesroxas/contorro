import { z } from "zod";
import { StylePropertySchema } from "./style-properties.js";

const TokenStylePropertySchema = z.object({
  type: z.literal("token"),
  property: StylePropertySchema,
  token: z.string(),
});

export const StyleBindingSchema = z.object({
  id: z.string(),
  nodeId: z.string(),
  properties: z.array(TokenStylePropertySchema),
});

export type TokenStyleProperty = z.infer<typeof TokenStylePropertySchema>;
export type StylePropertyEntry = TokenStyleProperty;
export type StyleBinding = z.infer<typeof StyleBindingSchema>;
