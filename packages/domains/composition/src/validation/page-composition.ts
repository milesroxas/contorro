import type { PageComposition } from "@repo/contracts-zod";
import { type Result, err, ok } from "@repo/kernel";

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

  for (const [key, node] of Object.entries(nodes)) {
    if (node.id !== key) {
      return err(`nodes key "${key}" must equal node.id "${node.id}"`);
    }
  }

  for (const sb of Object.values(styleBindings)) {
    if (!nodes[sb.nodeId]) {
      return err(
        `style binding "${sb.id}" references missing node "${sb.nodeId}"`,
      );
    }
  }

  for (const [id, node] of Object.entries(nodes)) {
    if (node.styleBindingId) {
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
  }

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
