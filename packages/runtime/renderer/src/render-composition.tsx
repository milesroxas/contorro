import type { TokenMeta } from "@repo/config-tailwind";
import type { PageComposition } from "@repo/contracts-zod";
import type { RuntimeRegistry } from "@repo/domains-runtime-catalog";
import type { CSSProperties, ReactElement } from "react";

import { resolveStyleBinding } from "./style-resolver.js";

function renderNode(
  nodeId: string,
  composition: PageComposition,
  registry: RuntimeRegistry,
  tokenMeta: TokenMeta[],
): ReactElement | null {
  const node = composition.nodes[nodeId];
  if (!node) {
    return null;
  }

  const Cmp = registry[node.definitionKey];
  if (!Cmp) {
    return null;
  }

  let className: string | undefined;
  let style: CSSProperties | undefined;

  if (node.styleBindingId) {
    const sb = composition.styleBindings[node.styleBindingId];
    if (sb) {
      const r = resolveStyleBinding(sb, tokenMeta);
      if (r.classes) {
        className = r.classes;
      }
      if (Object.keys(r.inlineStyle).length > 0) {
        style = r.inlineStyle as CSSProperties;
      }
    }
  }

  const childElements = node.childIds
    .map((cid) => renderNode(cid, composition, registry, tokenMeta))
    .filter((x): x is ReactElement => x !== null);

  return (
    <Cmp className={className} key={node.id} node={node} style={style}>
      {childElements}
    </Cmp>
  );
}

export function renderComposition(
  composition: PageComposition,
  registry: RuntimeRegistry,
  tokenMeta: TokenMeta[],
): ReactElement {
  const root = renderNode(composition.rootId, composition, registry, tokenMeta);
  if (!root) {
    throw new Error("Failed to render composition root");
  }
  return root;
}
