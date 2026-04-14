import type { RuntimePrimitiveProps } from "@repo/domains-runtime-catalog";

import { PrimitiveEmptyState } from "./primitive-empty-state.js";

/**
 * Fallback when a `primitive.libraryComponent` node was not expanded at render
 * (e.g. missing definition). Expanded trees never hit this component.
 */
export function LibraryComponent({
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
