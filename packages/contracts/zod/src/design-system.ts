import { z } from "zod";

/** Architecture spec §5.3 — token categories. */
export const TOKEN_CATEGORY_SCHEMA = z.enum([
  "color",
  "space",
  "size",
  "radius",
  "typography",
  "shadow",
  "border",
  "zIndex",
  "opacity",
  "transition",
  "breakpoint",
  "container",
]);

export type TokenCategory = z.infer<typeof TOKEN_CATEGORY_SCHEMA>;

/** Spec §5.3 — key shape `{category}.{name}` or `{category}.{scale}.{name}`. */
export const DesignTokenSchema = z.object({
  key: z.string().regex(/^[a-z]+(\.[a-z0-9]+)+$/),
  category: TOKEN_CATEGORY_SCHEMA,
  resolvedValue: z.string().min(1),
});

export type DesignTokenInput = z.infer<typeof DesignTokenSchema>;

export const LengthUnitSchema = z.enum(["px", "rem", "em", "%", "vw", "vh"]);

export const LengthValueSchema = z.object({
  value: z.number(),
  unit: LengthUnitSchema,
});

export const ColorValueSchema = z.object({
  hex: z.string().regex(/^#[0-9a-fA-F]{3,8}$/),
  alpha: z.number().min(0).max(1).optional(),
});

export const TokenReferenceSchema = z.object({
  kind: z.literal("reference"),
  key: z.string().regex(/^[a-z]+(\.[a-z0-9]+)+$/),
});

/** Values allowed for style overrides (composition §5.4 + length policy). */
export const OverrideValueSchema = z.union([
  LengthValueSchema,
  ColorValueSchema,
  z.number(),
  z.string(),
]);
