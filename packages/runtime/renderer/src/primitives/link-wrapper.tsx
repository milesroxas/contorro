import type { ReactNode } from "react";
import type { RuntimePrimitiveProps } from "../runtime-catalog.js";

/**
 * Anchor wrapper for link-bound containers/media (catalog `link` fields patch
 * `propValues.href`). No `href` → children render as-is (no dead `<a>`).
 * Mirrors `primitives/button.tsx` anchor semantics for rel/target.
 */
export function LinkWrapper({
  node,
  children,
}: {
  node: RuntimePrimitiveProps["node"];
  children: ReactNode;
}) {
  const href =
    typeof node.propValues?.href === "string" ? node.propValues.href : "";
  if (href === "") {
    return <>{children}</>;
  }
  const openInNewTab = Boolean(node.propValues?.openInNewTab);
  const ariaLabel =
    typeof node.propValues?.ariaLabel === "string" &&
    node.propValues.ariaLabel !== ""
      ? node.propValues.ariaLabel
      : undefined;
  return (
    <a
      aria-label={ariaLabel}
      className="contents"
      href={href}
      rel={openInNewTab ? "noopener noreferrer" : undefined}
      target={openInNewTab ? "_blank" : undefined}
    >
      {children}
    </a>
  );
}
