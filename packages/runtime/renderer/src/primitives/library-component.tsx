import type { RuntimePrimitiveProps } from "../runtime-catalog.js";

import { PrimitiveEmptyState } from "./primitive-empty-state.js";

/**
 * Debug placeholder for a `primitive.libraryComponent` node that was not
 * expanded (missing definition, graft failure). Studio canvas paths render
 * this explicitly; the public registry component below hides it in production.
 */
export function LibraryComponentPlaceholder({
  node,
  className,
  style,
}: RuntimePrimitiveProps) {
  const key =
    typeof node.propValues?.componentKey === "string"
      ? node.propValues.componentKey
      : "";
  return (
    <PrimitiveEmptyState className={className} style={style}>
      {key ? (
        <>
          <span className="font-medium text-foreground">Component</span>
          <div className="mt-1 font-mono text-xs">{key}</div>
        </>
      ) : (
        "Component"
      )}
    </PrimitiveEmptyState>
  );
}

// Renderer stays browser-safe (no node types); bundlers inline these env reads.
declare const process:
  | {
      env?: {
        NODE_ENV?: string;
        NEXT_PUBLIC_COMPOSITION_DEBUG?: string;
      };
    }
  | undefined;

function unexpandedRefDebugEnabled(): boolean {
  if (typeof process === "undefined") {
    return false;
  }
  return (
    process.env?.NODE_ENV !== "production" ||
    process.env?.NEXT_PUBLIC_COMPOSITION_DEBUG === "true"
  );
}

/**
 * Fallback when a `primitive.libraryComponent` node was not expanded at render.
 * Production renders nothing (call sites log the skip via `payload.logger`);
 * development — or `NEXT_PUBLIC_COMPOSITION_DEBUG=true` — keeps the placeholder.
 */
export function LibraryComponent(props: RuntimePrimitiveProps) {
  if (!unexpandedRefDebugEnabled()) {
    return null;
  }
  return <LibraryComponentPlaceholder {...props} />;
}
