import { IconChevronDown } from "@tabler/icons-react";
import { type ReactNode, useState } from "react";

import { cn } from "../lib/cn.js";
import { StudioLeftSidePanel } from "./studio-left-side-panel.js";
import {
  studioPanelBodyClass,
  studioPanelHeaderClass,
  studioPanelSurfaceClass,
} from "./studio-panel-chrome.js";
import { Button } from "./ui/button.js";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible.js";
import { ScrollArea } from "./ui/scroll-area.js";

export {
  studioLeftRailGridAdjacentEndClass,
  studioPanelBodyClass,
  studioPanelHeaderClass,
  studioPanelSurfaceClass,
} from "./studio-panel-chrome.js";

export function StudioPanel({
  title,
  children,
  className,
  bodyClassName,
  headerClassName,
  contentClassName,
  defaultOpen = true,
  collapsible = true,
  toolbar,
}: {
  title: string;
  children: ReactNode;
  className?: string;
  /** Scroll viewport padding; default is tuned for dense trees. */
  bodyClassName?: string;
  headerClassName?: string;
  /** Optional class for collapsible content container (e.g. flex sizing). */
  contentClassName?: string;
  defaultOpen?: boolean;
  collapsible?: boolean;
  /** Optional header controls for non-collapsible left rail panels (scroll is below). */
  toolbar?: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  if (!collapsible) {
    return (
      <StudioLeftSidePanel
        bodyClassName={bodyClassName}
        className={className}
        contentClassName={contentClassName}
        headerClassName={headerClassName}
        title={title}
        toolbar={toolbar}
      >
        {children}
      </StudioLeftSidePanel>
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
