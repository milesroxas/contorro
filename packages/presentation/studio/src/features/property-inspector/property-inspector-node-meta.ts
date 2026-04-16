import type { CompositionNode } from "@repo/contracts-zod";

export function semanticShellTagForNode(
  node: CompositionNode,
): "header" | "main" | "footer" | null {
  if (node.definitionKey !== "primitive.box") {
    return null;
  }
  const tag = node.propValues?.tag;
  return tag === "header" || tag === "main" || tag === "footer" ? tag : null;
}

export function boxSupportsDivSectionElementSetting(tag: unknown): boolean {
  if (tag === undefined || tag === null || tag === "") {
    return true;
  }
  return tag === "div" || tag === "section";
}

export function isNodeCollectionFieldMapped(node: CompositionNode): boolean {
  return (
    node.contentBinding?.source === "collection" &&
    typeof node.contentBinding.key === "string" &&
    node.contentBinding.key.trim() !== ""
  );
}
