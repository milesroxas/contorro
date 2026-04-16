import type { PageComposition } from "@repo/contracts-zod";
import { PageCompositionSchema } from "@repo/contracts-zod";
import { err, ok, type Result } from "@repo/kernel";

import { validatePageCompositionInvariants } from "../validation/page-composition.js";
import { clonePageCompositionWithNewIds } from "./clone-composition.js";

const REF_KEY = "primitive.libraryComponent";

function findFirstExpandableLibraryRefId(
  composition: PageComposition,
  skippedRefIds: Set<string>,
): string | null {
  for (const [id, node] of Object.entries(composition.nodes)) {
    if (node.definitionKey !== REF_KEY || skippedRefIds.has(id)) {
      continue;
    }
    const raw = node.propValues?.componentKey;
    const key = typeof raw === "string" && raw.trim() !== "" ? raw.trim() : "";
    if (key === "") {
      continue;
    }
    return id;
  }
  return null;
}

function graftEmbeddedAtRef(
  template: PageComposition,
  refId: string,
  embedded: PageComposition,
): Result<PageComposition, string> {
  const refNode = template.nodes[refId];
  if (!refNode) {
    return err(`missing ref node "${refId}"`);
  }
  if (refNode.parentId === null) {
    return err("library component reference cannot be the composition root");
  }
  const parentId = refNode.parentId;
  const parent = template.nodes[parentId];
  if (!parent) {
    return err(`missing parent "${parentId}"`);
  }

  const cloned = clonePageCompositionWithNewIds(embedded);
  const newRootId = cloned.rootId;
  const newRoot = cloned.nodes[newRootId];
  if (!newRoot) {
    return err("embedded composition missing root after clone");
  }

  const mergedNodes: PageComposition["nodes"] = { ...template.nodes };
  for (const [k, v] of Object.entries(cloned.nodes)) {
    mergedNodes[k] = v;
  }
  delete mergedNodes[refId];

  mergedNodes[newRootId] = {
    ...newRoot,
    parentId: parentId,
  };

  const newChildIds = parent.childIds.map((cid) =>
    cid === refId ? newRootId : cid,
  );
  mergedNodes[parentId] = {
    ...parent,
    childIds: newChildIds,
  };

  const mergedStyleBindings: PageComposition["styleBindings"] = {
    ...template.styleBindings,
    ...cloned.styleBindings,
  };

  const assembled: PageComposition = {
    rootId: template.rootId,
    nodes: mergedNodes,
    styleBindings: mergedStyleBindings,
  };

  const parsed = PageCompositionSchema.safeParse(assembled);
  if (!parsed.success) {
    return err("graft produced invalid composition");
  }
  const inv = validatePageCompositionInvariants(parsed.data);
  if (!inv.ok) {
    return err(inv.error);
  }
  return ok(parsed.data);
}

/**
 * Replaces each `primitive.libraryComponent` node with the cloned subtree of the
 * referenced library definition (by `propValues.componentKey`).
 */
export async function expandLibraryComponentNodes(
  composition: PageComposition,
  resolve: (componentKey: string) => Promise<PageComposition | null>,
): Promise<PageComposition> {
  let current = composition;
  const skippedRefIds = new Set<string>();
  for (let iter = 0; iter < 64; iter++) {
    const refId = findFirstExpandableLibraryRefId(current, skippedRefIds);
    if (refId === null) {
      return current;
    }
    const node = current.nodes[refId];
    const rawKey = node.propValues?.componentKey;
    const key =
      typeof rawKey === "string" && rawKey.trim() !== "" ? rawKey.trim() : "";

    const embedded = await resolve(key);
    if (!embedded) {
      skippedRefIds.add(refId);
      continue;
    }

    const next = graftEmbeddedAtRef(current, refId, embedded);
    if (!next.ok) {
      skippedRefIds.add(refId);
      continue;
    }
    current = next.value;
  }
  return current;
}
