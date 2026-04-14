import { z } from "zod";
import { StylePropertySchema } from "./style-properties.js";

export const SPACING_UTILITY_VALUES = [
  "0",
  "px",
  "0.5",
  "1",
  "1.5",
  "2",
  "2.5",
  "3",
  "3.5",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
  "14",
  "16",
  "20",
  "24",
  "28",
  "32",
  "36",
  "40",
  "44",
  "48",
  "52",
  "56",
  "60",
  "64",
  "72",
  "80",
  "96",
] as const;

export const MARGIN_UTILITY_VALUES = [
  ...SPACING_UTILITY_VALUES,
  "auto",
] as const;

const FRACTION_UTILITY_VALUES = [
  "1/2",
  "1/3",
  "2/3",
  "1/4",
  "2/4",
  "3/4",
  "1/5",
  "2/5",
  "3/5",
  "4/5",
] as const;

export const SIZE_UTILITY_VALUES = [
  ...SPACING_UTILITY_VALUES,
  "auto",
  "full",
  "screen",
  "min",
  "max",
  "fit",
  ...FRACTION_UTILITY_VALUES,
] as const;

export const ASPECT_RATIO_UTILITY_VALUES = [
  "auto",
  "square",
  "video",
  "1/1",
  "4/3",
  "3/2",
  "16/9",
  "21/9",
] as const;

export const CONTAINER_SIZE_UTILITY_VALUES = [
  "3xs",
  "2xs",
  "xs",
  "sm",
  "md",
  "lg",
  "xl",
  "2xl",
  "3xl",
  "4xl",
  "5xl",
  "6xl",
  "7xl",
] as const;

export const WIDTH_UTILITY_VALUES = [
  ...SIZE_UTILITY_VALUES,
  ...CONTAINER_SIZE_UTILITY_VALUES,
  "container",
] as const;

export const MIN_SIZE_UTILITY_VALUES = [
  ...SIZE_UTILITY_VALUES,
  ...CONTAINER_SIZE_UTILITY_VALUES,
] as const;

export const MAX_SIZE_UTILITY_VALUES = [
  ...SPACING_UTILITY_VALUES,
  "full",
  "screen",
  "min",
  "max",
  "fit",
  ...FRACTION_UTILITY_VALUES,
  "none",
] as const;

export const MAX_WIDTH_UTILITY_VALUES = [
  ...MAX_SIZE_UTILITY_VALUES,
  ...CONTAINER_SIZE_UTILITY_VALUES,
  "prose",
  "screen-sm",
  "screen-md",
  "screen-lg",
  "screen-xl",
  "screen-2xl",
] as const;

export const MAX_HEIGHT_UTILITY_VALUES = MAX_SIZE_UTILITY_VALUES;

export const DISPLAY_UTILITY_VALUES = [
  "block",
  "inline-block",
  "inline",
  "flex",
  "inline-flex",
  "grid",
  "inline-grid",
  "hidden",
] as const;

export const FONT_FAMILY_UTILITY_VALUES = ["sans", "serif", "mono"] as const;

export const FONT_SIZE_UTILITY_VALUES = [
  "xs",
  "sm",
  "base",
  "lg",
  "xl",
  "2xl",
  "3xl",
  "4xl",
  "5xl",
  "6xl",
  "7xl",
  "8xl",
  "9xl",
] as const;

export const FONT_WEIGHT_UTILITY_VALUES = [
  "thin",
  "extralight",
  "light",
  "normal",
  "medium",
  "semibold",
  "bold",
  "extrabold",
  "black",
] as const;

export const TEXT_ALIGN_UTILITY_VALUES = [
  "left",
  "center",
  "right",
  "justify",
  "start",
  "end",
] as const;

export const LINE_HEIGHT_UTILITY_VALUES = [
  "none",
  "tight",
  "snug",
  "normal",
  "relaxed",
  "loose",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
] as const;

export const LETTER_SPACING_UTILITY_VALUES = [
  "tighter",
  "tight",
  "normal",
  "wide",
  "wider",
  "widest",
] as const;

export const TEXT_TRANSFORM_UTILITY_VALUES = [
  "uppercase",
  "lowercase",
  "capitalize",
  "normal-case",
] as const;

export const FONT_STYLE_UTILITY_VALUES = ["italic", "not-italic"] as const;

export const TEXT_DECORATION_LINE_UTILITY_VALUES = [
  "underline",
  "overline",
  "line-through",
  "no-underline",
] as const;

export const BORDER_RADIUS_UTILITY_VALUES = [
  "none",
  "sm",
  "md",
  "lg",
  "xl",
  "2xl",
  "3xl",
  "full",
] as const;

export const BORDER_STYLE_UTILITY_VALUES = [
  "solid",
  "dashed",
  "dotted",
  "double",
  "hidden",
  "none",
] as const;

export const BORDER_WIDTH_UTILITY_VALUES = [
  "DEFAULT",
  "0",
  "2",
  "4",
  "8",
] as const;

export const BORDER_COLOR_UTILITY_VALUES = [
  "inherit",
  "current",
  "transparent",
  "black",
  "white",
] as const;

export const FLEX_DIRECTION_UTILITY_VALUES = [
  "row",
  "row-reverse",
  "col",
  "col-reverse",
] as const;

export const FLEX_WRAP_UTILITY_VALUES = [
  "wrap",
  "wrap-reverse",
  "nowrap",
] as const;

export const JUSTIFY_CONTENT_UTILITY_VALUES = [
  "start",
  "end",
  "center",
  "between",
  "around",
  "evenly",
] as const;

export const ALIGN_ITEMS_UTILITY_VALUES = [
  "start",
  "end",
  "center",
  "baseline",
  "stretch",
] as const;

export const ALIGN_SELF_UTILITY_VALUES = [
  "auto",
  "start",
  "end",
  "center",
  "stretch",
  "baseline",
] as const;

export const FLEX_UTILITY_VALUES = ["1", "auto", "initial", "none"] as const;

export const FLEX_GROW_UTILITY_VALUES = ["0", "1"] as const;

export const FLEX_SHRINK_UTILITY_VALUES = ["0", "1"] as const;

export const FLEX_BASIS_UTILITY_VALUES = [
  ...SIZE_UTILITY_VALUES,
  "prose",
] as const;

export const ORDER_UTILITY_VALUES = [
  "first",
  "last",
  "none",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
] as const;

const SPACING_UTILITY_PROPERTIES = new Set([
  "padding",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "gap",
]);

const MARGIN_UTILITY_PROPERTIES = new Set([
  "margin",
  "marginTop",
  "marginRight",
  "marginBottom",
  "marginLeft",
]);

const SIZE_UTILITY_PROPERTIES = new Set(["height"]);

const UTILITY_VALUES_BY_PROPERTY = {
  borderColor: BORDER_COLOR_UTILITY_VALUES,
  borderRadius: BORDER_RADIUS_UTILITY_VALUES,
  borderStyle: BORDER_STYLE_UTILITY_VALUES,
  borderWidth: BORDER_WIDTH_UTILITY_VALUES,
  fontFamily: FONT_FAMILY_UTILITY_VALUES,
  fontSize: FONT_SIZE_UTILITY_VALUES,
  fontWeight: FONT_WEIGHT_UTILITY_VALUES,
  textAlign: TEXT_ALIGN_UTILITY_VALUES,
  lineHeight: LINE_HEIGHT_UTILITY_VALUES,
  letterSpacing: LETTER_SPACING_UTILITY_VALUES,
  textTransform: TEXT_TRANSFORM_UTILITY_VALUES,
  fontStyle: FONT_STYLE_UTILITY_VALUES,
  textDecorationLine: TEXT_DECORATION_LINE_UTILITY_VALUES,
  display: DISPLAY_UTILITY_VALUES,
  flexDirection: FLEX_DIRECTION_UTILITY_VALUES,
  flexWrap: FLEX_WRAP_UTILITY_VALUES,
  justifyContent: JUSTIFY_CONTENT_UTILITY_VALUES,
  alignItems: ALIGN_ITEMS_UTILITY_VALUES,
  alignSelf: ALIGN_SELF_UTILITY_VALUES,
  flex: FLEX_UTILITY_VALUES,
  flexGrow: FLEX_GROW_UTILITY_VALUES,
  flexShrink: FLEX_SHRINK_UTILITY_VALUES,
  flexBasis: FLEX_BASIS_UTILITY_VALUES,
  order: ORDER_UTILITY_VALUES,
} as const;

export function utilityValuesForStyleProperty(
  property: string,
): readonly string[] {
  if (property in UTILITY_VALUES_BY_PROPERTY) {
    return UTILITY_VALUES_BY_PROPERTY[
      property as keyof typeof UTILITY_VALUES_BY_PROPERTY
    ];
  }
  if (SPACING_UTILITY_PROPERTIES.has(property)) {
    return SPACING_UTILITY_VALUES;
  }
  if (MARGIN_UTILITY_PROPERTIES.has(property)) {
    return MARGIN_UTILITY_VALUES;
  }
  if (property === "width") {
    return WIDTH_UTILITY_VALUES;
  }
  if (property === "aspectRatio") {
    return ASPECT_RATIO_UTILITY_VALUES;
  }
  if (property === "minWidth" || property === "minHeight") {
    return MIN_SIZE_UTILITY_VALUES;
  }
  if (property === "maxWidth") {
    return MAX_WIDTH_UTILITY_VALUES;
  }
  if (property === "maxHeight") {
    return MAX_HEIGHT_UTILITY_VALUES;
  }
  if (SIZE_UTILITY_PROPERTIES.has(property)) {
    return SIZE_UTILITY_VALUES;
  }
  return [];
}

const TokenStylePropertySchema = z.object({
  type: z.literal("token"),
  property: StylePropertySchema,
  token: z.string(),
});

const UtilityStylePropertySchema = z
  .object({
    type: z.literal("utility"),
    property: StylePropertySchema,
    value: z.string().trim().min(1).regex(/^\S+$/),
  })
  .superRefine((value, ctx) => {
    const allowedValues = utilityValuesForStyleProperty(value.property);
    if (allowedValues.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["property"],
        message: `Utility styles are not supported for "${value.property}"`,
      });
      return;
    }
    if (!allowedValues.includes(value.value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["value"],
        message: `Unsupported utility value "${value.value}" for "${value.property}"`,
      });
    }
  });

const StylePropertyEntrySchema = z.union([
  TokenStylePropertySchema,
  UtilityStylePropertySchema,
]);

export const StyleBindingSchema = z.object({
  id: z.string(),
  nodeId: z.string(),
  properties: z.array(StylePropertyEntrySchema),
});

export type TokenStyleProperty = z.infer<typeof TokenStylePropertySchema>;
export type UtilityStyleProperty = z.infer<typeof UtilityStylePropertySchema>;
export type StylePropertyEntry = z.infer<typeof StylePropertyEntrySchema>;
export type StyleBinding = z.infer<typeof StyleBindingSchema>;
