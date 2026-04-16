"use client";

import {
  imageTailwindUtilitiesFromPropValues,
  resolvePrimitiveImageSrcAlt,
} from "@repo/domains-composition";
import type { RuntimePrimitiveProps } from "@repo/domains-runtime-catalog";
import { twMerge } from "tailwind-merge";

import { useOptionalCollectionItemDoc } from "./collection-item-context.js";
import { PrimitiveEmptyState } from "./primitive-empty-state.js";

/** Image: src, alt; sizing from style binding; img-specific Tailwind via `imageUtilities`. */
export function Image({ node, className, style }: RuntimePrimitiveProps) {
  const doc = useOptionalCollectionItemDoc();
  const { src, alt } = resolvePrimitiveImageSrcAlt(node, doc);
  const utilities = imageTailwindUtilitiesFromPropValues(node.propValues);
  const mergedClassName = twMerge(className, utilities);
  const hasSource = src.trim().length > 0;

  if (!hasSource) {
    return (
      <PrimitiveEmptyState
        aria-label={alt || "Image placeholder"}
        className={mergedClassName}
        style={style}
        variant="centered"
      >
        <span className="text-xs font-semibold tracking-widest uppercase">
          Image
        </span>
      </PrimitiveEmptyState>
    );
  }

  return (
    <img
      alt={alt}
      className={mergedClassName}
      src={src || undefined}
      style={style}
    />
  );
}
