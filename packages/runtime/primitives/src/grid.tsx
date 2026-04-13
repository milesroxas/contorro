import type { RuntimePrimitiveProps } from "@repo/domains-runtime-catalog";
import type { CSSProperties } from "react";

/** Grid: columns, gap */
export function Grid({
  node,
  children,
  className,
  style,
}: RuntimePrimitiveProps) {
  const columns = Number(node.propValues?.columns ?? 1);

  const layout: CSSProperties = {
    display: "grid",
    gridTemplateColumns: `repeat(${Number.isFinite(columns) && columns > 0 ? columns : 1}, minmax(0, 1fr))`,
    ...style,
  };

  return (
    <div
      className={className}
      data-definition={node.definitionKey}
      style={layout}
    >
      {children}
    </div>
  );
}
