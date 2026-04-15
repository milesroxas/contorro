import type {
  CompositionNode,
  PageComposition,
  StyleBinding,
} from "@repo/contracts-zod";
import { makeId } from "@repo/kernel";

function remapChildIds(
  nodeIdMap: Map<string, string>,
  childIds: string[],
): string[] {
  return childIds.map((cid) => {
    const mapped = nodeIdMap.get(cid);
    if (!mapped) {
      throw new Error("clonePageCompositionWithNewIds: missing child mapping");
    }
    return mapped;
  });
}

function cloneNodeWithMappedIds(
  nodeIdMap: Map<string, string>,
  sbIdMap: Map<string, string>,
  oldId: string,
  node: CompositionNode,
): CompositionNode {
  const newId = nodeIdMap.get(oldId);
  if (!newId) {
    throw new Error("clonePageCompositionWithNewIds: missing node mapping");
  }
  const newParentId =
    node.parentId === null ? null : (nodeIdMap.get(node.parentId) ?? null);
  const newChildIds = remapChildIds(nodeIdMap, node.childIds);
  const newStyleBindingId = node.styleBindingId
    ? sbIdMap.get(node.styleBindingId)
    : undefined;

  return {
    ...node,
    id: newId,
    parentId: newParentId,
    childIds: newChildIds,
    ...(newStyleBindingId !== undefined
      ? { styleBindingId: newStyleBindingId }
      : {}),
  };
}

/**
 * Deep-clone a composition with fresh node and style-binding ids (template → new page).
 */
export function clonePageCompositionWithNewIds(
  composition: PageComposition,
): PageComposition {
  const nodeIdMap = new Map<string, string>();
  for (const k of Object.keys(composition.nodes)) {
    nodeIdMap.set(k, makeId());
  }
  const sbIdMap = new Map<string, string>();
  for (const k of Object.keys(composition.styleBindings)) {
    sbIdMap.set(k, makeId());
  }

  const newRootId = nodeIdMap.get(composition.rootId);
  if (!newRootId) {
    throw new Error("clonePageCompositionWithNewIds: missing root mapping");
  }

  const nodes: Record<string, CompositionNode> = {};
  for (const [oldId, node] of Object.entries(composition.nodes)) {
    const cloned = cloneNodeWithMappedIds(nodeIdMap, sbIdMap, oldId, node);
    nodes[cloned.id] = cloned;
  }

  const styleBindings: Record<string, StyleBinding> = {};
  for (const [oldId, sb] of Object.entries(composition.styleBindings)) {
    const newId = sbIdMap.get(oldId);
    const newNodeId = nodeIdMap.get(sb.nodeId);
    if (!newId || !newNodeId) {
      throw new Error(
        "clonePageCompositionWithNewIds: missing style binding mapping",
      );
    }
    styleBindings[newId] = {
      ...sb,
      id: newId,
      nodeId: newNodeId,
    };
  }

  return {
    rootId: newRootId,
    nodes,
    styleBindings,
  };
}
