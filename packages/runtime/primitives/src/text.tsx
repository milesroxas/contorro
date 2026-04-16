"use client";

import { resolvePrimitiveTextContent } from "@repo/domains-composition";
import type { RuntimePrimitiveProps } from "@repo/domains-runtime-catalog";

import { useOptionalCollectionItemDoc } from "./collection-item-context.js";

/** Text node uses `propValues.content` or `contentBinding` key for display (§5.4). */
export function Text({ node, className, style }: RuntimePrimitiveProps) {
  const doc = useOptionalCollectionItemDoc();
  const text = resolvePrimitiveTextContent(node, doc);

  return (
    <span className={className} style={style}>
      {text}
    </span>
  );
}
