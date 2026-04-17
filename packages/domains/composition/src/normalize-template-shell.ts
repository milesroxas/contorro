import type { PageComposition } from "@repo/contracts-zod";

function withTag(
  node: PageComposition["nodes"][string],
  tag: "fragment" | "div" | "header" | "main" | "footer",
): PageComposition["nodes"][string] {
  return {
    ...node,
    propValues: {
      ...(node.propValues ?? {}),
      tag,
    },
  };
}

/**
 * Ensures page template shell nodes use semantic `tag` prop values (fragment, header, main, footer).
 */
export function normalizeTemplateShell(
  composition: PageComposition,
): PageComposition {
  const root = composition.nodes[composition.rootId];
  if (!root) {
    return composition;
  }

  const nodes: PageComposition["nodes"] = Object.fromEntries(
    Object.entries(composition.nodes).map(([id, node]) => [id, { ...node }]),
  );

  const rootNode = nodes[composition.rootId];
  if (!rootNode) {
    return composition;
  }

  const rootChildren = rootNode.childIds.map((id) => nodes[id]).filter(Boolean);
  const shellHeader = rootChildren.find((node) =>
    node.id.startsWith("page-header"),
  );
  const shellMain = rootChildren.find((node) =>
    node.id.startsWith("page-main"),
  );
  const shellFooter = rootChildren.find((node) =>
    node.id.startsWith("page-footer"),
  );

  if (
    rootNode.parentId === null &&
    rootNode.definitionKey === "primitive.box" &&
    shellHeader &&
    shellMain &&
    shellFooter
  ) {
    nodes[rootNode.id] = withTag(rootNode, "fragment");
    nodes[shellHeader.id] = withTag(shellHeader, "header");
    nodes[shellMain.id] = withTag(shellMain, "main");
    nodes[shellFooter.id] = withTag(shellFooter, "footer");
    return {
      ...composition,
      nodes,
    };
  }

  return composition;
}
