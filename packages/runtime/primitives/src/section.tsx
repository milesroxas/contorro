import type { RuntimePrimitiveProps } from "@repo/domains-runtime-catalog";

/** Semantic `<section>` — layout/spacing/visual styles via style binding (same contract as Box). */
export function Section({ children, className, style }: RuntimePrimitiveProps) {
  return (
    <section className={className} style={style}>
      {children}
    </section>
  );
}
