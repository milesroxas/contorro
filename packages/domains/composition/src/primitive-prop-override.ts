import type { CompositionNode } from "@repo/contracts-zod";

import { defaultPrimitivePropValues } from "./primitives.js";

function jsonEquals(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) {
    return true;
  }
  if (
    typeof a !== "object" ||
    a === null ||
    typeof b !== "object" ||
    b === null
  ) {
    return false;
  }
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

/**
 * Whether `propValues[propKey]` is present and differs from the primitive's
 * default for that key (or is an extra key with no declared default).
 */
export function isPrimitivePropValueModified(
  definitionKey: string,
  propKey: string,
  propValues: CompositionNode["propValues"],
): boolean {
  if (!propValues || !(propKey in propValues)) {
    return false;
  }
  const value = propValues[propKey];
  const defaults = defaultPrimitivePropValues(definitionKey);
  if (Object.hasOwn(defaults, propKey)) {
    return !jsonEquals(value, defaults[propKey]);
  }
  return true;
}
