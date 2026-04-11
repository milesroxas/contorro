import type { PageComposition } from "@repo/contracts-zod";

/** Collects designer/engineer definition keys referenced in a page composition tree. */
export function collectDefinitionKeysFromPageComposition(
  composition: PageComposition,
): string[] {
  const keys = new Set<string>();
  for (const node of Object.values(composition.nodes)) {
    keys.add(node.definitionKey);
  }
  return [...keys];
}

export function pageCompositionUsesDefinitionKey(
  composition: PageComposition,
  definitionKey: string,
): boolean {
  for (const node of Object.values(composition.nodes)) {
    if (node.definitionKey === definitionKey) {
      return true;
    }
  }
  return false;
}
