import type { StyleProperty } from "@repo/contracts-zod";

export const CHILD_CONTAINER_PRIMITIVE_KEYS = [
  "primitive.box",
  "primitive.stack",
  "primitive.grid",
] as const;

const CHILD_CONTAINER_PRIMITIVE_KEY_SET = new Set<string>(
  CHILD_CONTAINER_PRIMITIVE_KEYS,
);

export function isChildContainerPrimitive(definitionKey: string): boolean {
  return CHILD_CONTAINER_PRIMITIVE_KEY_SET.has(definitionKey);
}

export const CONTAINER_STYLE_PROPERTIES: readonly StyleProperty[] = [
  "padding",
  "margin",
  "width",
  "height",
  "minWidth",
  "minHeight",
  "maxWidth",
  "maxHeight",
];
