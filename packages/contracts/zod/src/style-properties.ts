import { z } from "zod";

export const STYLE_PROPERTY_KEYS = [
  "background",
  "color",
  "padding",
  "margin",
  "gap",
  "width",
  "height",
  "minWidth",
  "minHeight",
  "maxWidth",
  "maxHeight",
] as const;

export const StylePropertySchema = z.enum(STYLE_PROPERTY_KEYS);

export type StyleProperty = z.infer<typeof StylePropertySchema>;
