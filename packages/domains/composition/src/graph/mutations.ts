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
  isBuilderCreatablePrimitiveKey,
  primitiveKindForDefinitionKey,
} from "../primitives.js";

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
  if (!isBuilderCreatablePrimitiveKey(definitionKey)) {
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

  const nextNodes: PageComposition["nodes"] = {
    ...composition.nodes,
    [newId]: newNode,
    [parentId]: {
      ...parent,
      childIds: siblings,
    },
  };

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

  const nextNodes: PageComposition["nodes"] = { ...composition.nodes };

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
