import type { CSSProperties, ReactNode } from "react";

/** Shared dashed / muted chrome for runtime primitive empty UI (keeps binding on the outer node). */
const EMPTY_INNER_BASE =
  "rounded-md border border-dashed border-muted-foreground/40 bg-muted/20 text-center text-sm text-muted-foreground";

const INNER_BY_VARIANT = {
  centered: `${EMPTY_INNER_BASE} flex aspect-video min-h-[8rem] w-full items-center justify-center`,
  panel: `${EMPTY_INNER_BASE} px-3 py-4`,
} as const;

export type PrimitiveEmptyStateVariant = keyof typeof INNER_BY_VARIANT;

export type PrimitiveEmptyStateProps = {
  "aria-label"?: string;
  className?: string;
  style?: CSSProperties;
  variant?: PrimitiveEmptyStateVariant;
  children: ReactNode;
};

/**
 * Empty / placeholder shell: style binding applies to the outer wrapper only;
 * visual chrome stays on an inner element so margin, width, and aspect utilities resolve predictably.
 */
export function PrimitiveEmptyState({
  "aria-label": ariaLabel,
  className,
  style,
  variant = "panel",
  children,
}: PrimitiveEmptyStateProps) {
  return (
    <div aria-label={ariaLabel} className={className} style={style}>
      <div className={INNER_BY_VARIANT[variant]}>{children}</div>
    </div>
  );
}
