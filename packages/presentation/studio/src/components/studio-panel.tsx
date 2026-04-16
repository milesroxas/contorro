import { IconChevronDown } from "@tabler/icons-react";
import { type ReactNode, useState } from "react";

import { cn } from "../lib/cn.js";
import { ScrollArea } from "./scroll-area.js";
import { Button } from "./ui/button.js";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible.js";

/** Shared chrome for Studio side panels (Primitives, Layers, etc.). */
export const studioPanelSurfaceClass =
  "flex min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-border/80 bg-card/40 text-card-foreground dark:bg-card/25";

export const studioPanelHeaderClass =
  "shrink-0 px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground/95";

export const studioPanelBodyClass = "p-3";

export function StudioPanel({
  title,
  children,
  className,
  bodyClassName,
  contentClassName,
  defaultOpen = true,
  collapsible = true,
}: {
  title: string;
  children: ReactNode;
  className?: string;
  /** Scroll viewport padding; default is tuned for dense trees. */
  bodyClassName?: string;
  /** Optional class for collapsible content container (e.g. flex sizing). */
  contentClassName?: string;
  defaultOpen?: boolean;
  collapsible?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  if (!collapsible) {
    return (
      <div className={cn(studioPanelSurfaceClass, className)}>
        <div className={studioPanelHeaderClass}>{title}</div>
        <div
          className={cn(
            "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
            contentClassName,
          )}
        >
          <ScrollArea className="min-h-0 min-w-0 flex-1 basis-0">
            <div
              className={cn(
                "min-w-0 max-w-full",
                studioPanelBodyClass,
                bodyClassName,
              )}
            >
              {children}
            </div>
          </ScrollArea>
        </div>
      </div>
    );
  }

  return (
    <Collapsible
      className={cn(studioPanelSurfaceClass, className)}
      onOpenChange={setOpen}
      open={open}
    >
      <CollapsibleTrigger
        className={cn(
          studioPanelHeaderClass,
          "flex w-full items-center justify-between gap-2 text-left",
        )}
      >
        <span>{title}</span>
        <IconChevronDown
          aria-hidden
          className={cn("size-3.5 transition-transform", open && "rotate-180")}
          stroke={2}
        />
      </CollapsibleTrigger>
      <CollapsibleContent
        className={cn(
          "flex min-h-0 min-w-0 flex-col overflow-hidden data-[state=closed]:hidden",
          contentClassName,
        )}
      >
        <ScrollArea className="min-h-0 min-w-0 flex-1 basis-0">
          <div
            className={cn(
              "min-w-0 max-w-full",
              studioPanelBodyClass,
              bodyClassName,
            )}
          >
            {children}
          </div>
        </ScrollArea>
      </CollapsibleContent>
    </Collapsible>
  );
}

/** aria/title strings for bulk expand–collapse in Layers and Inspector (single source of truth). */
export const STUDIO_BULK_COLLAPSE_EXPAND_LABEL = "Expand sections";
export const STUDIO_BULK_COLLAPSE_COLLAPSE_LABEL = "Collapse sections";

/**
 * Outline panel control matching the Layers tree “Expand” / “Collapse” control.
 * Use for collapsing/expanding multiple groups with one action (layers sections, style sections, etc.).
 */
export function StudioBulkCollapseButton({
  allCollapsed,
  onClick,
  className,
}: {
  /** When true, everything in scope is collapsed and the control expands. */
  allCollapsed: boolean;
  onClick: () => void;
  className?: string;
}) {
  const label = allCollapsed
    ? STUDIO_BULK_COLLAPSE_EXPAND_LABEL
    : STUDIO_BULK_COLLAPSE_COLLAPSE_LABEL;
  return (
    <Button
      aria-label={label}
      aria-pressed={!allCollapsed}
      className={cn("shrink-0", className)}
      onClick={onClick}
      size="panel"
      title={label}
      type="button"
      variant="compact"
    >
      {allCollapsed ? "Expand" : "Collapse"}
    </Button>
  );
}
