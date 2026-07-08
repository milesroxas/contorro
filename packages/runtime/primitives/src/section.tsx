import type { RuntimePrimitiveProps } from "@repo/runtime-renderer";

/** Semantic `<section>` — layout/spacing/visual styles via style binding (same contract as Box). */
export function Section({ children, className, style }: RuntimePrimitiveProps) {
  return (
    <section className={className} style={style}>
      {children}
    </section>
  );
}
