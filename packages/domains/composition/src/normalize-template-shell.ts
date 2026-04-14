import type { PageComposition } from "@repo/contracts-zod";

function withTag(
  node: PageComposition["nodes"][string],
  tag: "div" | "header" | "main" | "footer",
): PageComposition["nodes"][string] {
  return {
    ...node,
    propValues: {
      ...(node.propValues ?? {}),
      tag,
    },
  };
}

function uniqueNodeId(base: string, nodes: PageComposition["nodes"]): string {
  if (!nodes[base]) {
    return base;
  }
  let i = 1;
  while (nodes[`${base}-${i}`]) {
    i += 1;
  }
  return `${base}-${i}`;
}

/**
 * Upgrades legacy template roots (`primitive.stack`) to the current template shell:
 * root box -> header box + main box(main slot + existing children) + footer box.
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
    nodes[rootNode.id] = withTag(rootNode, "div");
    nodes[shellHeader.id] = withTag(shellHeader, "header");
    nodes[shellMain.id] = withTag(shellMain, "main");
    nodes[shellFooter.id] = withTag(shellFooter, "footer");
    return {
      ...composition,
      nodes,
    };
  }

  if (
    rootNode.parentId !== null ||
    rootNode.definitionKey !== "primitive.stack"
  ) {
    return composition;
  }

  const headerId = uniqueNodeId("page-header", nodes);
  const mainId = uniqueNodeId("page-main", nodes);
  const mainSlotId = uniqueNodeId("page-main-slot", nodes);
  const footerId = uniqueNodeId("page-footer", nodes);
  const legacyChildren = [...rootNode.childIds];

  nodes[rootNode.id] = withTag(
    {
      ...rootNode,
      definitionKey: "primitive.box",
      childIds: [headerId, mainId, footerId],
    },
    "div",
  );

  nodes[headerId] = {
    id: headerId,
    kind: "primitive",
    definitionKey: "primitive.box",
    parentId: rootNode.id,
    childIds: [],
    propValues: { tag: "header" },
  };

  nodes[mainId] = {
    id: mainId,
    kind: "primitive",
    definitionKey: "primitive.box",
    parentId: rootNode.id,
    childIds: [mainSlotId, ...legacyChildren],
    propValues: { tag: "main" },
  };

  nodes[mainSlotId] = {
    id: mainSlotId,
    kind: "slot",
    definitionKey: "primitive.slot",
    parentId: mainId,
    childIds: [],
    propValues: { slotId: "main" },
  };

  nodes[footerId] = {
    id: footerId,
    kind: "primitive",
    definitionKey: "primitive.box",
    parentId: rootNode.id,
    childIds: [],
    propValues: { tag: "footer" },
  };

  for (const childId of legacyChildren) {
    const child = nodes[childId];
    if (child) {
      child.parentId = mainId;
    }
  }

  return {
    ...composition,
    nodes,
  };
}
