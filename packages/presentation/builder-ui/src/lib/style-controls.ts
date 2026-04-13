import { isContainerPrimitiveKey } from "@repo/domains-composition";

export function isChildContainerPrimitive(definitionKey: string): boolean {
  return isContainerPrimitiveKey(definitionKey);
}
