import { resolvedBoxBackgroundImagePresentation } from "@repo/domains-composition";
import type { RuntimePrimitiveProps } from "@repo/domains-runtime-catalog";

function mergeClassNames(a: string | undefined, b: string): string | undefined {
  const merged = [a, b].filter((part) => part && part.length > 0).join(" ");
  return merged.length > 0 ? merged : undefined;
}

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

  const backgroundImage = resolvedBoxBackgroundImagePresentation(
    node.propValues,
  );

  return (
    <Tag
      className={mergeClassNames(className, backgroundImage.className)}
      style={{ ...backgroundImage.style, ...style }}
    >
      {children}
    </Tag>
  );
}
