import type { RuntimePrimitiveProps } from "@repo/domains-runtime-catalog";
import type { CSSProperties } from "react";

/** Stack: direction, gap, align, justify (Phase 2 table). */
export function Stack({
  node,
  children,
  className,
  style,
}: RuntimePrimitiveProps) {
  const direction =
    (node.propValues?.direction as string | undefined) === "row"
      ? "row"
      : "column";
  const gap = (node.propValues?.gap as string | undefined) ?? "0";
  const align = (node.propValues?.align as string | undefined) ?? "stretch";
  const justify =
    (node.propValues?.justify as string | undefined) ?? "flex-start";

  const layout: CSSProperties = {
    display: "flex",
    flexDirection: direction === "row" ? "row" : "column",
    alignItems: align,
    justifyContent: justify,
    gap,
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
