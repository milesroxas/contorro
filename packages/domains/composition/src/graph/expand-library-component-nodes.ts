import type { PageComposition } from "@repo/contracts-zod";
import { PageCompositionSchema } from "@repo/contracts-zod";
import { err, ok, type Result } from "@repo/kernel";

import { mergeEditorFieldValuesIntoComposition } from "../editor-field-values.js";
import { validatePageCompositionInvariants } from "../validation/page-composition.js";
import { clonePageCompositionWithNewIds } from "./clone-composition.js";

const REF_KEY = "primitive.libraryComponent";

export type ExpandLibraryComponentNodesOptions = {
  /**
   * Map media IDs in `propValues.editorFieldValues` on the ref node to URLs before merging
   * into the embedded composition (matches `renderDesignerContent` / block rendering).
   */
  resolveEditorFieldImages?: (
    embedded: PageComposition,
    editorFieldValues: Record<string, unknown>,
  ) => Promise<Record<string, unknown>>;
};

function libraryRefEditorFieldValues(
  refNode: PageComposition["nodes"][string],
): Record<string, unknown> | null {
  const raw = refNode.propValues?.editorFieldValues;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }
  const values = raw as Record<string, unknown>;
  return Object.keys(values).length > 0 ? values : null;
}

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

async function graftEmbeddedAtRef(
  template: PageComposition,
  refId: string,
  embedded: PageComposition,
  options?: ExpandLibraryComponentNodesOptions,
): Promise<Result<PageComposition, string>> {
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

  const editorFieldValues = libraryRefEditorFieldValues(refNode);
  let valuesToMerge: Record<string, unknown> | null = editorFieldValues;
  if (
    editorFieldValues !== null &&
    options?.resolveEditorFieldImages !== undefined
  ) {
    valuesToMerge = await options.resolveEditorFieldImages(
      embedded,
      editorFieldValues,
    );
  }
  const embeddedWithInstanceValues =
    valuesToMerge === null
      ? embedded
      : mergeEditorFieldValuesIntoComposition(embedded, valuesToMerge);

  const cloned = clonePageCompositionWithNewIds(embeddedWithInstanceValues);
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
  options?: ExpandLibraryComponentNodesOptions,
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

    const next = await graftEmbeddedAtRef(current, refId, embedded, options);
    if (!next.ok) {
      skippedRefIds.add(refId);
      continue;
    }
    current = next.value;
  }
  return current;
}
