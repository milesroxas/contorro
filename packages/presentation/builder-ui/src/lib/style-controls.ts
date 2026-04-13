import type { StyleProperty } from "@repo/contracts-zod";
import { isContainerPrimitiveKey } from "@repo/domains-composition";

export function isChildContainerPrimitive(definitionKey: string): boolean {
  return isContainerPrimitiveKey(definitionKey);
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
