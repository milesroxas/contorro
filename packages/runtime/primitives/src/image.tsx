"use client";

import { resolvePrimitiveImageSrcAlt } from "@repo/domains-composition";
import type { RuntimePrimitiveProps } from "@repo/domains-runtime-catalog";

import { useOptionalCollectionItemDoc } from "./collection-item-context.js";
import { PrimitiveEmptyState } from "./primitive-empty-state.js";

/** Image: src, alt, width, height, objectFit */
export function Image({ node, className, style }: RuntimePrimitiveProps) {
  const doc = useOptionalCollectionItemDoc();
  const { src, alt } = resolvePrimitiveImageSrcAlt(node, doc);
  const width = node.propValues?.width as string | number | undefined;
  const height = node.propValues?.height as string | number | undefined;
  const objectFit =
    (node.propValues?.objectFit as string | undefined) ?? "cover";
  const hasSource = src.trim().length > 0;

  if (!hasSource) {
    return (
      <PrimitiveEmptyState
        aria-label={alt || "Image placeholder"}
        className={className}
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
      className={className}
      height={typeof height === "number" ? height : undefined}
      src={src || undefined}
      style={{
        objectFit: objectFit as "cover" | "contain" | "fill" | "none",
        ...style,
      }}
      width={typeof width === "number" ? width : undefined}
    />
  );
}
