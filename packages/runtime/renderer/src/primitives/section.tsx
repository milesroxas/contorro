import type { RuntimePrimitiveProps } from "../runtime-catalog.js";

import { LinkWrapper } from "./link-wrapper.js";

/** Semantic `<section>` — layout/spacing/visual styles via style binding (same contract as Box). */
export function Section({
  node,
  children,
  className,
  style,
}: RuntimePrimitiveProps) {
  return (
    <LinkWrapper node={node}>
      <section className={className} style={style}>
        {children}
      </section>
    </LinkWrapper>
  );
}
