"use client";

import { resolvePrimitiveTextContent } from "@repo/domains-composition";
import type { RuntimePrimitiveProps } from "@repo/domains-runtime-catalog";

import { useOptionalCollectionItemDoc } from "./collection-item-context.js";

const VALID_HEADING_LEVELS = new Set(["h1", "h2", "h3", "h4", "h5", "h6"]);

export function Heading({ node, className, style }: RuntimePrimitiveProps) {
  const doc = useOptionalCollectionItemDoc();
  const levelRaw = node.propValues?.level;
  const level =
    typeof levelRaw === "string" && VALID_HEADING_LEVELS.has(levelRaw)
      ? levelRaw
      : "h2";
  const content = resolvePrimitiveTextContent(node, doc);

  return (
    <>
      {level === "h1" ? (
        <h1 className={className} style={style}>
          {content}
        </h1>
      ) : null}
      {level === "h2" ? (
        <h2 className={className} style={style}>
          {content}
        </h2>
      ) : null}
      {level === "h3" ? (
        <h3 className={className} style={style}>
          {content}
        </h3>
      ) : null}
      {level === "h4" ? (
        <h4 className={className} style={style}>
          {content}
        </h4>
      ) : null}
      {level === "h5" ? (
        <h5 className={className} style={style}>
          {content}
        </h5>
      ) : null}
      {level === "h6" ? (
        <h6 className={className} style={style}>
          {content}
        </h6>
      ) : null}
    </>
  );
}
