import { resolvedBoxBackgroundImageInlineStyle } from "@repo/domains-composition";
import type { RuntimePrimitiveProps } from "@repo/domains-runtime-catalog";

/** §Phase 2 — Box: padding, margin, background, border, radius (via style binding + props). */
export function Box({
  node,
  children,
  className,
  style,
}: RuntimePrimitiveProps) {
  const rawTag = node.propValues?.tag;

  if (rawTag === "fragment") {
    return <>{children}</>;
  }

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

  const backgroundImageStyle = resolvedBoxBackgroundImageInlineStyle(
    node.propValues,
  );

  return (
    <Tag className={className} style={{ ...backgroundImageStyle, ...style }}>
      {children}
    </Tag>
  );
}
