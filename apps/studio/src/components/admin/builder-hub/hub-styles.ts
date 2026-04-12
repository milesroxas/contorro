import { cn } from "@/lib/utils";

/** Full-viewport region: horizontal center always; vertical center on md+ when content is short. */
export const hubViewportClass = cn(
  "flex w-full min-h-0 flex-1 flex-col items-center",
  "justify-start py-10 sm:py-12",
  "md:justify-center md:py-14 lg:py-16",
  "px-4 sm:px-8 lg:px-10",
);

/** Main column width + vertical rhythm between header / body / panels. */
export const hubStepShellClass = cn(
  "flex w-full max-w-2xl flex-col md:max-w-3xl",
  "gap-8 md:gap-10 lg:gap-12",
);

/** Step indicator (eyebrow). */
export const hubEyebrowClass = cn(
  "text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase",
  "md:text-sm",
);

/** Primary page title for the hub. */
export const hubTitleClass = cn(
  "font-heading text-2xl font-semibold tracking-tight text-foreground",
  "md:text-3xl lg:text-[2rem] lg:leading-tight",
);

/** Supporting line under the title. */
export const hubLeadClass = cn(
  "max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground",
  "md:text-lg md:leading-relaxed",
);

/** Grid for paired choice tiles. */
export const hubTileGridClass = cn(
  "grid w-full grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 md:gap-6",
);

/**
 * Large choice tiles — single interaction model for buttons + links.
 * Hover/active/focus use design tokens only; motion prefers reduced-motion via Tailwind.
 */
export const hubChoiceTileClass = cn(
  "inline-flex min-h-[6.5rem] w-full cursor-pointer items-center rounded-none border border-border bg-card p-5 text-left text-card-foreground shadow-none",
  "md:min-h-[7.5rem] md:p-6",
  "motion-safe:transition-[transform,box-shadow,background-color,border-color] motion-safe:duration-200 motion-safe:ease-out",
  "hover:border-ring/50 hover:bg-accent/55 hover:shadow-sm",
  "active:scale-[0.995] motion-reduce:active:scale-100",
  "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/45 focus-visible:outline-none",
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
);

export const hubTileTitleClass = cn(
  "font-heading text-base font-semibold text-foreground md:text-lg",
);

export const hubTileDescriptionClass = cn(
  "text-sm leading-snug text-muted-foreground md:text-[0.9375rem] md:leading-relaxed",
);

export const hubTileIconWrapClass = cn(
  "flex size-11 shrink-0 items-center justify-center bg-muted text-foreground ring-1 ring-border",
  "md:size-12",
  "motion-safe:transition-colors motion-safe:duration-200",
  "group-hover/tile:bg-muted/80",
);

/** List / filter panel — matches shell width. */
export const hubPanelClass = cn(
  "w-full rounded-none border border-border bg-card text-card-foreground shadow-none",
  "p-5 md:p-6 lg:p-7",
  "flex flex-col gap-5 md:gap-6",
);

export const hubFilterLabelClass = cn(
  "text-sm font-medium text-muted-foreground md:text-base",
);

export const hubInputClass = cn(
  "h-11 border-border bg-card pl-10 text-sm md:h-12 md:pl-11 md:text-base",
);

export const hubScrollAreaClass = cn(
  "max-h-64 pr-3 md:max-h-80 lg:max-h-[22rem]",
);

/** List row: subtle hover affordance (token-based). */
export const hubListRowClass = cn(
  "group/row flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 md:py-5",
  "-mx-1 rounded-none px-1 motion-safe:transition-colors motion-safe:duration-150",
  "hover:bg-muted/35",
);
