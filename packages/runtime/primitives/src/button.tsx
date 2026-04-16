"use client";

import { resolvePrimitiveButtonLabel } from "@repo/domains-composition";
import type { RuntimePrimitiveProps } from "@repo/domains-runtime-catalog";

import { useOptionalCollectionItemDoc } from "./collection-item-context.js";

function resolveHref(node: RuntimePrimitiveProps["node"]): string {
  const linkType = node.propValues?.linkType;
  if (linkType === "payloadCollection") {
    const collection =
      typeof node.propValues?.collectionSlug === "string"
        ? node.propValues.collectionSlug.trim().replace(/^\/+|\/+$/g, "")
        : "";
    const entry =
      typeof node.propValues?.entrySlug === "string"
        ? node.propValues.entrySlug.trim().replace(/^\/+|\/+$/g, "")
        : "";
    if (!collection) {
      return "";
    }
    return entry ? `/${collection}/${entry}` : `/${collection}`;
  }
  return typeof node.propValues?.href === "string" ? node.propValues.href : "";
}

export function Button({ node, className, style }: RuntimePrimitiveProps) {
  const doc = useOptionalCollectionItemDoc();
  const label = resolvePrimitiveButtonLabel(node, doc);
  const href = resolveHref(node);
  const openInNewTab = Boolean(node.propValues?.openInNewTab);

  return (
    <a
      className={className}
      href={href || undefined}
      rel={openInNewTab ? "noopener noreferrer" : undefined}
      style={style}
      target={openInNewTab ? "_blank" : undefined}
    >
      {label}
    </a>
  );
}
