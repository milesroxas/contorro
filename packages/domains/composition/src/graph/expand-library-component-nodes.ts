import type {
  CompositionNode,
  PageComposition,
  StyleBinding,
} from "@repo/contracts-zod";
import {
  err,
  ok,
  PageCompositionSchema,
  type Result,
} from "@repo/contracts-zod";

import { validatePageCompositionInvariants } from "../validation/page-composition.js";
import { clonePageCompositionWithNewIds } from "./clone-composition.js";

const REF_KEY = "primitive.libraryComponent";

export type ExpandLibraryComponentNodesOptions = {
  /** Called for every ref that could not be expanded (missing definition, graft failure). */
  onSkip?: (refId: string, componentKey: string, reason: string) => void;
};

function stylePropertyMergeKey(
  entry: StyleBinding["properties"][number],
): string {
  return `${entry.property}|${entry.breakpoint ?? "base"}`;
}

/**
 * Transfers the ref node's style binding onto the grafted root so styled
 * instances keep their instance styling (audit §1.2a — previously the orphaned
 * binding failed invariants and the whole instance was skipped).
 * Instance properties win over same-property root entries.
 */
function transferRefStyleBindingToRoot(
  refBinding: StyleBinding,
  root: CompositionNode,
  rootBinding: StyleBinding | undefined,
  newRootId: string,
): { root: CompositionNode; binding: StyleBinding } {
  if (!rootBinding) {
    const binding: StyleBinding = { ...refBinding, nodeId: newRootId };
    return {
      root: { ...root, styleBindingId: binding.id },
      binding,
    };
  }
  const overridden = new Set(refBinding.properties.map(stylePropertyMergeKey));
  const mergedProperties = [
    ...rootBinding.properties.filter(
      (entry) => !overridden.has(stylePropertyMergeKey(entry)),
    ),
    ...refBinding.properties,
  ];
  return {
    root,
    binding: { ...rootBinding, properties: mergedProperties },
  };
}

/**
 * Embedded library refs are design-only: grafted nodes keep their authored
 * `propValues`, but editor content bindings are stripped so the same component
 * embedded twice never collides on binding names (audit §1.2b) and page-level
 * block values never leak into embedded designs.
 */
function withoutEditorContentBinding(node: CompositionNode): CompositionNode {
  if (node.contentBinding?.source !== "editor") {
    return node;
  }
  const { contentBinding: _dropped, ...rest } = node;
  return rest;
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
  const clonedRoot = cloned.nodes[newRootId];
  if (!clonedRoot) {
    return err("embedded composition missing root after clone");
  }

  const mergedNodes: PageComposition["nodes"] = { ...template.nodes };
  for (const [k, v] of Object.entries(cloned.nodes)) {
    mergedNodes[k] = withoutEditorContentBinding(v);
  }
  delete mergedNodes[refId];

  const mergedStyleBindings: PageComposition["styleBindings"] = {
    ...template.styleBindings,
    ...cloned.styleBindings,
  };

  let newRoot: CompositionNode = {
    ...withoutEditorContentBinding(clonedRoot),
    parentId: parentId,
  };

  // The ref node is removed; its style binding must move with the instance.
  if (refNode.styleBindingId) {
    const refBinding = template.styleBindings[refNode.styleBindingId];
    delete mergedStyleBindings[refNode.styleBindingId];
    if (refBinding) {
      const rootBinding = newRoot.styleBindingId
        ? mergedStyleBindings[newRoot.styleBindingId]
        : undefined;
      const transferred = transferRefStyleBindingToRoot(
        refBinding,
        newRoot,
        rootBinding,
        newRootId,
      );
      newRoot = transferred.root;
      mergedStyleBindings[transferred.binding.id] = transferred.binding;
    }
  }

  mergedNodes[newRootId] = newRoot;

  const newChildIds = parent.childIds.map((cid) =>
    cid === refId ? newRootId : cid,
  );
  mergedNodes[parentId] = {
    ...parent,
    childIds: newChildIds,
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

/**
 * Replaces each `primitive.libraryComponent` node with the cloned subtree of the
 * referenced library definition (by `propValues.componentKey`). Embedded refs
 * are design-only: authored `propValues` render as-is, editor bindings are
 * stripped, and instance styling transfers to the grafted root.
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
      options?.onSkip?.(
        refId,
        key,
        "definition not found or has no composition",
      );
      continue;
    }

    const next = graftEmbeddedAtRef(current, refId, embedded);
    if (!next.ok) {
      skippedRefIds.add(refId);
      options?.onSkip?.(refId, key, next.error);
      continue;
    }
    current = next.value;
  }
  return current;
}
