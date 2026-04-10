import type { RuntimePrimitiveProps } from "@repo/domains-runtime-catalog";

/** §Phase 2 — Box: padding, margin, background, border, radius (via style binding + props). */
export function Box({
  node,
  children,
  className,
  style,
}: RuntimePrimitiveProps) {
  return (
    <div
      className={className}
      data-definition={node.definitionKey}
      style={style}
    >
      {children}
    </div>
  );
}
