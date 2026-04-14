import type { RuntimePrimitiveProps } from "@repo/domains-runtime-catalog";

/** §Phase 2 — Box: padding, margin, background, border, radius (via style binding + props). */
export function Box({
  node,
  children,
  className,
  style,
}: RuntimePrimitiveProps) {
  const rawTag = node.propValues?.tag;
  const tag =
    rawTag === "header" ||
    rawTag === "main" ||
    rawTag === "footer" ||
    rawTag === "section" ||
    rawTag === "article" ||
    rawTag === "aside" ||
    rawTag === "nav"
      ? rawTag
      : "div";

  const Tag = tag;

  return (
    <Tag className={className} style={style}>
      {children}
    </Tag>
  );
}
