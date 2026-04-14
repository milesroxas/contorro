import type { RuntimePrimitiveProps } from "@repo/domains-runtime-catalog";

/** Region where per-page designer blocks are injected at publish time (see `renderComposition` slot map). */
export function Slot({
  children,
  className,
  style,
}: RuntimePrimitiveProps) {
  return <div className={className} style={style}>{children}</div>;
}
