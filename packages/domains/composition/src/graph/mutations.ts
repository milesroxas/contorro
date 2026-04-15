import type {
  CompositionNode,
  PageComposition,
  StyleBinding,
  StyleProperty,
  StylePropertyEntry,
} from "@repo/contracts-zod";
import { PageCompositionSchema } from "@repo/contracts-zod";
import { makeId } from "@repo/kernel";
import { type Result, err, ok } from "@repo/kernel";
import {
  defaultPrimitivePropValues,
  isStudioCreatablePrimitiveKey,
  primitiveKindForDefinitionKey,
} from "../primitives.js";

const EMPTY_CONTAINER_SPACING_PROPERTIES = new Set<StyleProperty>([
  "padding",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "margin",
  "marginTop",
  "marginRight",
  "marginBottom",
  "marginLeft",
]);

function collectDescendants(
  nodes: PageComposition["nodes"],
  rootId: string,
): Set<string> {
  const out = new Set<string>();
  const walk = (id: string) => {
    out.add(id);
    const n = nodes[id];
    if (!n) {
      return;
    }
    for (const c of n.childIds) {
      walk(c);
    }
  };
  walk(rootId);
  return out;
}

function pruneStyleBindings(
  composition: PageComposition,
  removedNodeIds: Set<string>,
): Record<string, StyleBinding> {
  const next: Record<string, StyleBinding> = {};
  for (const [k, sb] of Object.entries(composition.styleBindings)) {
    if (!removedNodeIds.has(sb.nodeId)) {
      next[k] = sb;
    }
  }
  return next;
}

function clearNodeEmptyStateSpacingStyles(
  nodes: PageComposition["nodes"],
  styleBindings: PageComposition["styleBindings"],
  nodeId: string,
): {
  nodes: PageComposition["nodes"];
  styleBindings: PageComposition["styleBindings"];
} {
  const node = nodes[nodeId];
  if (!node?.styleBindingId || node.definitionKey !== "primitive.box") {
    return { nodes, styleBindings };
  }
  const binding = styleBindings[node.styleBindingId];
  if (!binding) {
    return { nodes, styleBindings };
  }

  const nextProperties = binding.properties.filter(
    (property) => !EMPTY_CONTAINER_SPACING_PROPERTIES.has(property.property),
  );
  if (nextProperties.length === binding.properties.length) {
    return { nodes, styleBindings };
  }

  const nextStyleBindings = { ...styleBindings };
  if (nextProperties.length === 0) {
    delete nextStyleBindings[binding.id];
    return {
      nodes: {
        ...nodes,
        [nodeId]: {
          ...node,
          styleBindingId: undefined,
        },
      },
      styleBindings: nextStyleBindings,
    };
  }

  nextStyleBindings[binding.id] = {
    ...binding,
    properties: nextProperties,
  };
  return { nodes, styleBindings: nextStyleBindings };
}

/**
 * Adds a new primitive node as the last child of `parentId`.
 * For `primitive.libraryComponent`, pass `libraryComponentKey` (definition `key` in Payload).
 */
export function addChildNode(
  composition: PageComposition,
  parentId: string,
  definitionKey: string,
  insertIndex?: number,
  options?: { libraryComponentKey?: string },
): Result<PageComposition, "INVALID_NODE"> {
  if (!isStudioCreatablePrimitiveKey(definitionKey)) {
    return err("INVALID_NODE");
  }
  if (definitionKey === "primitive.libraryComponent") {
    const k = options?.libraryComponentKey?.trim();
    if (!k) {
      return err("INVALID_NODE");
    }
  }
  const parent = composition.nodes[parentId];
  if (!parent) {
    return err("INVALID_NODE");
  }
  if (parent.definitionKey === "primitive.slot") {
    return err("INVALID_NODE");
  }

  const newId = makeId();
  const kind = primitiveKindForDefinitionKey(definitionKey);
  const newNode: CompositionNode = {
    id: newId,
    kind,
    definitionKey,
    parentId,
    childIds: [],
    propValues:
      definitionKey === "primitive.libraryComponent"
        ? { componentKey: options?.libraryComponentKey?.trim() ?? "" }
        : defaultPrimitivePropValues(definitionKey),
  };

  const siblings = [...parent.childIds];
  const at =
    insertIndex === undefined
      ? siblings.length
      : Math.max(0, Math.min(insertIndex, siblings.length));
  siblings.splice(at, 0, newId);
  const parentWasEmpty = parent.childIds.length === 0;

  let nextNodes: PageComposition["nodes"] = {
    ...composition.nodes,
    [newId]: newNode,
    [parentId]: {
      ...parent,
      childIds: siblings,
    },
  };
  let nextStyleBindings = { ...composition.styleBindings };

  if (parentWasEmpty) {
    const reset = clearNodeEmptyStateSpacingStyles(
      nextNodes,
      nextStyleBindings,
      parentId,
    );
    nextNodes = reset.nodes;
    nextStyleBindings = reset.styleBindings;
  }

  const assembled: PageComposition = {
    rootId: composition.rootId,
    nodes: nextNodes,
    styleBindings: nextStyleBindings,
  };

  const parsed = PageCompositionSchema.safeParse(assembled);
  if (!parsed.success) {
    return err("INVALID_NODE");
  }
  return ok(parsed.data);
}

/**
 * Sets or clears `contentBinding` on a node (e.g. expose text to CMS editors).
 */
export function setNodeContentBinding(
  composition: PageComposition,
  nodeId: string,
  contentBinding: CompositionNode["contentBinding"],
): Result<PageComposition, "INVALID_NODE"> {
  const node = composition.nodes[nodeId];
  if (!node) {
    return err("INVALID_NODE");
  }
  const nextNode: CompositionNode = {
    ...node,
    contentBinding,
  };
  const nextNodes = { ...composition.nodes, [nodeId]: nextNode };
  const assembled: PageComposition = {
    rootId: composition.rootId,
    nodes: nextNodes,
    styleBindings: { ...composition.styleBindings },
  };
  const parsed = PageCompositionSchema.safeParse(assembled);
  if (!parsed.success) {
    return err("INVALID_NODE");
  }
  return ok(parsed.data);
}

/**
 * Moves an existing subtree to `targetParentId` at `index` (0-based in the
 * target's child list after the node is removed from its current parent).
 */
export function moveNode(
  composition: PageComposition,
  nodeId: string,
  targetParentId: string,
  index: number,
): Result<PageComposition, "INVALID_NODE"> {
  if (nodeId === composition.rootId) {
    return err("INVALID_NODE");
  }
  const node = composition.nodes[nodeId];
  if (!node || node.parentId === null) {
    return err("INVALID_NODE");
  }

  const targetParent = composition.nodes[targetParentId];
  if (!targetParent) {
    return err("INVALID_NODE");
  }
  if (targetParent.definitionKey === "primitive.slot") {
    return err("INVALID_NODE");
  }

  if (collectDescendants(composition.nodes, nodeId).has(targetParentId)) {
    return err("INVALID_NODE");
  }

  const oldParentId = node.parentId;
  const oldParent = composition.nodes[oldParentId];
  if (!oldParent) {
    return err("INVALID_NODE");
  }

  const newOldChildren = oldParent.childIds.filter((id) => id !== nodeId);
  const targetParentWasEmpty =
    oldParentId !== targetParentId && targetParent.childIds.length === 0;

  let nextNodes: PageComposition["nodes"] = { ...composition.nodes };

  if (oldParentId === targetParentId) {
    const without = newOldChildren;
    const insertAt = Math.max(0, Math.min(index, without.length));
    const newSiblings = [...without];
    newSiblings.splice(insertAt, 0, nodeId);
    nextNodes[oldParentId] = { ...oldParent, childIds: newSiblings };
  } else {
    const targetSiblings = targetParent.childIds.filter((id) => id !== nodeId);
    const insertAt = Math.max(0, Math.min(index, targetSiblings.length));
    const newTargetChildren = [...targetSiblings];
    newTargetChildren.splice(insertAt, 0, nodeId);

    nextNodes[oldParentId] = { ...oldParent, childIds: newOldChildren };
    nextNodes[targetParentId] = {
      ...targetParent,
      childIds: newTargetChildren,
    };
    nextNodes[nodeId] = { ...node, parentId: targetParentId };
  }

  let nextStyleBindings = { ...composition.styleBindings };
  if (targetParentWasEmpty) {
    const reset = clearNodeEmptyStateSpacingStyles(
      nextNodes,
      nextStyleBindings,
      targetParentId,
    );
    nextNodes = reset.nodes;
    nextStyleBindings = reset.styleBindings;
  }

  const assembled: PageComposition = {
    rootId: composition.rootId,
    nodes: nextNodes,
    styleBindings: nextStyleBindings,
  };

  const parsed = PageCompositionSchema.safeParse(assembled);
  if (!parsed.success) {
    return err("INVALID_NODE");
  }
  return ok(parsed.data);
}

/**
 * Removes a node and its descendants. Cannot remove the document root.
 */
export function removeSubtree(
  composition: PageComposition,
  nodeId: string,
): Result<PageComposition, "INVALID_NODE"> {
  if (nodeId === composition.rootId) {
    return err("INVALID_NODE");
  }
  if (!composition.nodes[nodeId]) {
    return err("INVALID_NODE");
  }

  const toRemove = collectDescendants(composition.nodes, nodeId);
  const node = composition.nodes[nodeId];
  if (!node || node.parentId === null) {
    return err("INVALID_NODE");
  }
  const parent = composition.nodes[node.parentId];
  if (!parent) {
    return err("INVALID_NODE");
  }

  const nextNodes: PageComposition["nodes"] = { ...composition.nodes };
  for (const id of toRemove) {
    delete nextNodes[id];
  }
  nextNodes[node.parentId] = {
    ...parent,
    childIds: parent.childIds.filter((id) => id !== nodeId),
  };

  const nextBindings = pruneStyleBindings(composition, toRemove);
  const assembled: PageComposition = {
    rootId: composition.rootId,
    nodes: nextNodes,
    styleBindings: nextBindings,
  };

  const parsed = PageCompositionSchema.safeParse(assembled);
  if (!parsed.success) {
    return err("INVALID_NODE");
  }
  return ok(parsed.data);
}

function idMapsForDuplicateSubtree(
  descendants: Set<string>,
  styleBindings: PageComposition["styleBindings"],
): { nodeIdMap: Map<string, string>; sbIdMap: Map<string, string> } {
  const nodeIdMap = new Map<string, string>();
  for (const id of descendants) {
    nodeIdMap.set(id, makeId());
  }
  const sbIdMap = new Map<string, string>();
  for (const [sbId, sb] of Object.entries(styleBindings)) {
    if (descendants.has(sb.nodeId)) {
      sbIdMap.set(sbId, makeId());
    }
  }
  return { nodeIdMap, sbIdMap };
}

function newParentIdForDuplicatedNode(
  oldId: string,
  duplicateRootId: string,
  parentId: string,
  oldNode: CompositionNode,
  nodeIdMap: Map<string, string>,
): string | null {
  if (oldId === duplicateRootId) {
    return parentId;
  }
  if (oldNode.parentId === null) {
    return null;
  }
  return nodeIdMap.get(oldNode.parentId) ?? null;
}

function cloneOneDuplicatedNode(
  composition: PageComposition,
  oldId: string,
  duplicateRootId: string,
  parentId: string,
  nodeIdMap: Map<string, string>,
  sbIdMap: Map<string, string>,
): Result<CompositionNode, "INVALID_NODE"> {
  const oldNode = composition.nodes[oldId];
  if (!oldNode) {
    return err("INVALID_NODE");
  }
  const newId = nodeIdMap.get(oldId);
  if (!newId) {
    return err("INVALID_NODE");
  }
  const newParentId = newParentIdForDuplicatedNode(
    oldId,
    duplicateRootId,
    parentId,
    oldNode,
    nodeIdMap,
  );
  if (newParentId === null) {
    return err("INVALID_NODE");
  }

  let propValues = oldNode.propValues;
  if (oldNode.definitionKey === "primitive.slot") {
    propValues = {
      ...(propValues ?? {}),
      slotId: makeId(),
    };
  }

  const contentBinding =
    oldNode.contentBinding?.source === "editor"
      ? undefined
      : oldNode.contentBinding;

  const newStyleBindingId = oldNode.styleBindingId
    ? sbIdMap.get(oldNode.styleBindingId)
    : undefined;
  if (oldNode.styleBindingId && newStyleBindingId === undefined) {
    return err("INVALID_NODE");
  }

  const newChildIds: string[] = [];
  for (const cid of oldNode.childIds) {
    const mapped = nodeIdMap.get(cid);
    if (!mapped) {
      return err("INVALID_NODE");
    }
    newChildIds.push(mapped);
  }

  const cloned: CompositionNode = {
    ...oldNode,
    id: newId,
    parentId: newParentId,
    childIds: newChildIds,
    propValues,
    contentBinding,
  };
  if (newStyleBindingId !== undefined) {
    cloned.styleBindingId = newStyleBindingId;
  } else {
    cloned.styleBindingId = undefined;
  }
  return ok(cloned);
}

function remapStyleBindingsForDuplicateSubtree(
  styleBindings: PageComposition["styleBindings"],
  descendants: Set<string>,
  nodeIdMap: Map<string, string>,
  sbIdMap: Map<string, string>,
): Result<PageComposition["styleBindings"], "INVALID_NODE"> {
  const nextStyleBindings: PageComposition["styleBindings"] = {
    ...styleBindings,
  };
  for (const [oldSbId, sb] of Object.entries(styleBindings)) {
    if (!descendants.has(sb.nodeId)) {
      continue;
    }
    const newSbId = sbIdMap.get(oldSbId);
    const newNid = nodeIdMap.get(sb.nodeId);
    if (!newSbId || !newNid) {
      return err("INVALID_NODE");
    }
    nextStyleBindings[newSbId] = {
      ...sb,
      id: newSbId,
      nodeId: newNid,
    };
  }
  return ok(nextStyleBindings);
}

/**
 * Deep-duplicates `nodeId` and its subtree with fresh ids, inserted as the next
 * sibling under the same parent. Cannot duplicate the document root.
 * Editor `contentBinding` entries are cleared on the copy to avoid duplicate field names.
 * Layout slots in the copy get a fresh `slotId` so layout slot ids stay unique.
 */
export function duplicateNode(
  composition: PageComposition,
  nodeId: string,
): Result<PageComposition, "INVALID_NODE"> {
  if (nodeId === composition.rootId) {
    return err("INVALID_NODE");
  }
  const node = composition.nodes[nodeId];
  if (!node || node.parentId === null) {
    return err("INVALID_NODE");
  }
  const parentId = node.parentId;
  const parent = composition.nodes[parentId];
  if (!parent) {
    return err("INVALID_NODE");
  }
  if (parent.definitionKey === "primitive.slot") {
    return err("INVALID_NODE");
  }

  const descendants = collectDescendants(composition.nodes, nodeId);
  const { nodeIdMap, sbIdMap } = idMapsForDuplicateSubtree(
    descendants,
    composition.styleBindings,
  );

  const nextNodes: PageComposition["nodes"] = { ...composition.nodes };

  for (const oldId of descendants) {
    const cloned = cloneOneDuplicatedNode(
      composition,
      oldId,
      nodeId,
      parentId,
      nodeIdMap,
      sbIdMap,
    );
    if (!cloned.ok) {
      return cloned;
    }
    nextNodes[cloned.value.id] = cloned.value;
  }

  const newRootDupId = nodeIdMap.get(nodeId);
  if (!newRootDupId) {
    return err("INVALID_NODE");
  }
  const origIdx = parent.childIds.indexOf(nodeId);
  if (origIdx === -1) {
    return err("INVALID_NODE");
  }
  const newParentChildren = [...parent.childIds];
  newParentChildren.splice(origIdx + 1, 0, newRootDupId);
  nextNodes[parentId] = { ...parent, childIds: newParentChildren };

  const bindingsResult = remapStyleBindingsForDuplicateSubtree(
    composition.styleBindings,
    descendants,
    nodeIdMap,
    sbIdMap,
  );
  if (!bindingsResult.ok) {
    return bindingsResult;
  }

  const assembled: PageComposition = {
    rootId: composition.rootId,
    nodes: nextNodes,
    styleBindings: bindingsResult.value,
  };

  const parsed = PageCompositionSchema.safeParse(assembled);
  if (!parsed.success) {
    return err("INVALID_NODE");
  }
  return ok(parsed.data);
}

/**
 * Shallow merge into `node.propValues`.
 */
export function updateNodePropValues(
  composition: PageComposition,
  nodeId: string,
  patch: Record<string, unknown>,
): Result<PageComposition, "INVALID_NODE"> {
  const node = composition.nodes[nodeId];
  if (!node) {
    return err("INVALID_NODE");
  }
  const nextNode: CompositionNode = {
    ...node,
    propValues: { ...node.propValues, ...patch },
  };
  const nextNodes = { ...composition.nodes, [nodeId]: nextNode };
  const assembled: PageComposition = {
    rootId: composition.rootId,
    nodes: nextNodes,
    styleBindings: { ...composition.styleBindings },
  };
  const parsed = PageCompositionSchema.safeParse(assembled);
  if (!parsed.success) {
    return err("INVALID_NODE");
  }
  return ok(parsed.data);
}

/**
 * Sets `propValues[propKey]` back to the primitive default, or removes the key
 * when there is no declared default.
 */
export function resetNodePropKeyToPrimitiveDefault(
  composition: PageComposition,
  nodeId: string,
  propKey: string,
): Result<PageComposition, "INVALID_NODE"> {
  const node = composition.nodes[nodeId];
  if (!node) {
    return err("INVALID_NODE");
  }
  const defaults = defaultPrimitivePropValues(node.definitionKey);
  const prev = node.propValues ?? {};
  const next: Record<string, unknown> = { ...prev };
  if (Object.prototype.hasOwnProperty.call(defaults, propKey)) {
    next[propKey] = defaults[propKey as keyof typeof defaults];
  } else {
    delete next[propKey];
  }
  const nextNode: CompositionNode = {
    ...node,
    propValues: Object.keys(next).length > 0 ? next : undefined,
  };
  const assembled: PageComposition = {
    rootId: composition.rootId,
    nodes: { ...composition.nodes, [nodeId]: nextNode },
    styleBindings: { ...composition.styleBindings },
  };
  const parsed = PageCompositionSchema.safeParse(assembled);
  if (!parsed.success) {
    return err("INVALID_NODE");
  }
  return ok(parsed.data);
}

/**
 * Removes all style overrides for a node (clears its style binding).
 */
export function clearNodeStyleBinding(
  composition: PageComposition,
  nodeId: string,
): Result<PageComposition, "INVALID_NODE"> {
  const node = composition.nodes[nodeId];
  if (!node) {
    return err("INVALID_NODE");
  }
  const bindingId = node.styleBindingId;
  if (!bindingId) {
    return ok(composition);
  }
  const nextBindings = { ...composition.styleBindings };
  delete nextBindings[bindingId];
  const nextNode: CompositionNode = { ...node, styleBindingId: undefined };
  const assembled: PageComposition = {
    rootId: composition.rootId,
    nodes: { ...composition.nodes, [nodeId]: nextNode },
    styleBindings: nextBindings,
  };
  const parsed = PageCompositionSchema.safeParse(assembled);
  if (!parsed.success) {
    return err("INVALID_NODE");
  }
  return ok(parsed.data);
}

/**
 * Sets or replaces a single token-backed style property on a node (creates `StyleBinding` when needed).
 */
export function setNodeTokenStyle(
  composition: PageComposition,
  nodeId: string,
  property: StyleProperty,
  token: string,
): Result<PageComposition, "INVALID_NODE"> {
  if (token.trim() === "") {
    return upsertNodeStyleProperty(composition, nodeId, property);
  }
  return upsertNodeStyleProperty(composition, nodeId, property, {
    type: "token",
    property,
    token: token.trim(),
  });
}

/**
 * Sets or clears a single style property entry on a node.
 */
export function setNodeStyleProperty(
  composition: PageComposition,
  nodeId: string,
  property: StyleProperty,
  entry: StylePropertyEntry | null,
): Result<PageComposition, "INVALID_NODE"> {
  if (entry === null) {
    return upsertNodeStyleProperty(composition, nodeId, property);
  }
  return upsertNodeStyleProperty(composition, nodeId, property, entry);
}

function upsertNodeStyleProperty(
  composition: PageComposition,
  nodeId: string,
  property: StyleProperty,
  nextProperty?: StylePropertyEntry,
): Result<PageComposition, "INVALID_NODE"> {
  const node = composition.nodes[nodeId];
  if (!node) {
    return err("INVALID_NODE");
  }

  const existingBindingId = node.styleBindingId;
  const existing =
    existingBindingId !== undefined
      ? composition.styleBindings[existingBindingId]
      : undefined;
  const filtered = (existing?.properties ?? []).filter(
    (p) => p.property !== property,
  );
  const properties = nextProperty ? [...filtered, nextProperty] : filtered;

  const nextNode: CompositionNode =
    properties.length > 0
      ? {
          ...node,
          styleBindingId: existingBindingId ?? makeId(),
        }
      : {
          ...node,
          styleBindingId: undefined,
        };

  const nextBindings = { ...composition.styleBindings };
  if (existingBindingId && properties.length === 0) {
    delete nextBindings[existingBindingId];
  } else if (nextNode.styleBindingId) {
    const binding: StyleBinding = {
      id: nextNode.styleBindingId,
      nodeId,
      properties,
    };
    nextBindings[nextNode.styleBindingId] = binding;
  }

  const assembled: PageComposition = {
    rootId: composition.rootId,
    nodes: { ...composition.nodes, [nodeId]: nextNode },
    styleBindings: nextBindings,
  };

  const parsed = PageCompositionSchema.safeParse(assembled);
  if (!parsed.success) {
    return err("INVALID_NODE");
  }
  return ok(parsed.data);
}
