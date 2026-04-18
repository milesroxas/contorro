import type { TokenMeta } from "@repo/config-tailwind";
import type { CompositionNode, PageComposition } from "@repo/contracts-zod";
import type { RuntimeRegistry } from "@repo/domains-runtime-catalog";
import type { ReactElement, ReactNode } from "react";

import type { ResolveNodeStyleOptions } from "./style-resolver.js";
import { resolveNodeStyle } from "./style-resolver.js";

function normalizedLayoutSlotId(node: CompositionNode): string {
  const raw = node.propValues?.slotId;
  if (typeof raw === "string" && raw.trim() !== "") {
    return raw.trim();
  }
  return "main";
}

export type RenderCompositionOptions = {
  /** Injected under each `primitive.slot` node, keyed by layout slot id. */
  slotContent?: Record<string, ReactNode>;
} & ResolveNodeStyleOptions;

function renderNode(
  nodeId: string,
  composition: PageComposition,
  registry: RuntimeRegistry,
  tokenMeta: TokenMeta[],
  options: RenderCompositionOptions | undefined,
): ReactElement | null {
  const node = composition.nodes[nodeId];
  if (!node) {
    return null;
  }

  const Cmp = registry[node.definitionKey];
  if (!Cmp) {
    return null;
  }

  const resolvedNodeStyle = resolveNodeStyle(
    node,
    composition,
    tokenMeta,
    options?.studioPreviewFlattenToBreakpoint !== undefined
      ? {
          studioPreviewFlattenToBreakpoint:
            options.studioPreviewFlattenToBreakpoint,
        }
      : undefined,
  );
  const className = resolvedNodeStyle.className;

  if (node.definitionKey === "primitive.slot") {
    const slotId = normalizedLayoutSlotId(node);
    const injected = options?.slotContent?.[slotId] ?? null;
    return (
      <Cmp className={className} key={node.id} node={node}>
        {injected}
      </Cmp>
    );
  }

  const childElements = node.childIds
    .map((cid) => renderNode(cid, composition, registry, tokenMeta, options))
    .filter((x): x is ReactElement => x !== null);

  if (node.definitionKey === "primitive.collection") {
    return (
      <Cmp
        className={className}
        collectionTemplate={childElements}
        key={node.id}
        node={node}
      />
    );
  }

  return (
    <Cmp className={className} key={node.id} node={node}>
      {childElements}
    </Cmp>
  );
}

export function renderComposition(
  composition: PageComposition,
  registry: RuntimeRegistry,
  tokenMeta: TokenMeta[],
  options?: RenderCompositionOptions,
): ReactElement {
  const root = renderNode(
    composition.rootId,
    composition,
    registry,
    tokenMeta,
    options,
  );
  if (!root) {
    throw new Error("Failed to render composition root");
  }
  return root;
}
