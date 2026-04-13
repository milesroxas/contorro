import { z } from "zod";

export const STYLE_PROPERTY_KEYS = [
  "background",
  "color",
  "display",
  "flexDirection",
  "flexWrap",
  "justifyContent",
  "alignItems",
  "alignSelf",
  "flex",
  "flexGrow",
  "flexShrink",
  "flexBasis",
  "order",
  "padding",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "margin",
  "marginTop",
  "marginRight",
  "marginBottom",
  "marginLeft",
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
