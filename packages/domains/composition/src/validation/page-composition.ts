import type { PageComposition } from "@repo/contracts-zod";
import { type Result, err, ok } from "@repo/kernel";

import { normalizedLayoutSlotId } from "../layout-slot.js";

function validateNodeKeysMatchNodes(
  nodes: PageComposition["nodes"],
): Result<void, string> {
  for (const [key, node] of Object.entries(nodes)) {
    if (node.id !== key) {
      return err(`nodes key "${key}" must equal node.id "${node.id}"`);
    }
  }
  return ok(undefined);
}

function validateStyleBindingsReferenceNodes(
  nodes: PageComposition["nodes"],
  styleBindings: PageComposition["styleBindings"],
): Result<void, string> {
  for (const sb of Object.values(styleBindings)) {
    if (!nodes[sb.nodeId]) {
      return err(
        `style binding "${sb.id}" references missing node "${sb.nodeId}"`,
      );
    }
  }
  return ok(undefined);
}

function validateNodesStyleBindingAlignment(
  nodes: PageComposition["nodes"],
  styleBindings: PageComposition["styleBindings"],
): Result<void, string> {
  for (const [id, node] of Object.entries(nodes)) {
    if (!node.styleBindingId) {
      continue;
    }
    const sb = styleBindings[node.styleBindingId];
    if (!sb) {
      return err(
        `node "${id}" references missing style binding "${node.styleBindingId}"`,
      );
    }
    if (sb.nodeId !== id) {
      return err(`style binding "${sb.id}" nodeId must match node "${id}"`);
    }
  }
  return ok(undefined);
}

function validateChildParentLinks(
  nodes: PageComposition["nodes"],
): Result<void, string> {
  for (const [id, node] of Object.entries(nodes)) {
    for (const cid of node.childIds) {
      const child = nodes[cid];
      if (!child) {
        return err(`node "${id}" lists missing child "${cid}"`);
      }
      if (child.parentId !== id) {
        return err(
          `child "${cid}" parentId must be "${id}", got "${child.parentId}"`,
        );
      }
    }
  }
  return ok(undefined);
}

function validateLayoutSlotsUnique(
  nodes: PageComposition["nodes"],
): Result<void, string> {
  const layoutSlotIds = new Map<string, string>();
  for (const [id, node] of Object.entries(nodes)) {
    if (node.definitionKey !== "primitive.slot") {
      continue;
    }
    if (node.childIds.length > 0) {
      return err(`layout slot node "${id}" must not contain builder children`);
    }
    const sid = normalizedLayoutSlotId(node);
    if (layoutSlotIds.has(sid)) {
      return err(
        `duplicate layout slot id "${sid}" (nodes "${layoutSlotIds.get(sid)}" and "${id}")`,
      );
    }
    layoutSlotIds.set(sid, id);
  }
  return ok(undefined);
}

function validateEditorFieldNamesUnique(
  nodes: PageComposition["nodes"],
): Result<void, string> {
  const editorFieldNames = new Set<string>();
  for (const node of Object.values(nodes)) {
    const cb = node.contentBinding;
    if (cb?.source !== "editor" || !cb.editorField) {
      continue;
    }
    if (cb.key !== cb.editorField.name) {
      return err(
        `editor contentBinding key "${cb.key}" must match editorField.name "${cb.editorField.name}"`,
      );
    }
    if (editorFieldNames.has(cb.editorField.name)) {
      return err(`duplicate editor field name "${cb.editorField.name}"`);
    }
    editorFieldNames.add(cb.editorField.name);
  }
  return ok(undefined);
}

function validateNonRootNodesLinked(
  rootId: string,
  nodes: PageComposition["nodes"],
): Result<void, string> {
  for (const [id, node] of Object.entries(nodes)) {
    if (id === rootId) {
      continue;
    }
    if (node.parentId === null) {
      return err(`non-root node "${id}" must not have parentId null`);
    }
    const parent = nodes[node.parentId];
    if (!parent) {
      return err(`node "${id}" references missing parent "${node.parentId}"`);
    }
    if (!parent.childIds.includes(id)) {
      return err(`parent "${node.parentId}" must list "${id}" in childIds`);
    }
  }
  return ok(undefined);
}

/**
 * Graph invariants beyond Zod: single root, parent/child agreement, style binding alignment.
 */
export function validatePageCompositionInvariants(
  c: PageComposition,
): Result<void, string> {
  const { rootId, nodes, styleBindings } = c;

  const root = nodes[rootId];
  if (!root) {
    return err("rootId must reference a node in nodes");
  }
  if (root.parentId !== null) {
    return err("root node must have parentId null");
  }

  const steps: Result<void, string>[] = [
    validateNodeKeysMatchNodes(nodes),
    validateStyleBindingsReferenceNodes(nodes, styleBindings),
    validateNodesStyleBindingAlignment(nodes, styleBindings),
    validateChildParentLinks(nodes),
    validateLayoutSlotsUnique(nodes),
    validateEditorFieldNamesUnique(nodes),
    validateNonRootNodesLinked(rootId, nodes),
  ];
  for (const step of steps) {
    if (!step.ok) {
      return step;
    }
  }
  return ok(undefined);
}
