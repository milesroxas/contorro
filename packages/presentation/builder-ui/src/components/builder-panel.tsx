import { IconChevronDown } from "@tabler/icons-react";
import { type ReactNode, useState } from "react";

import { cn } from "../lib/cn.js";
import { ScrollArea } from "./scroll-area.js";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible.js";

/** Shared chrome for builder side panels (Primitives, Layers, etc.). */
export const builderPanelSurfaceClass =
  "flex min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-border/80 bg-card/40 text-card-foreground shadow-sm dark:bg-card/25";

export const builderPanelHeaderClass =
  "shrink-0 border-b border-border/60 bg-muted/25 px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground dark:bg-muted/15";

export const builderPanelBodyClass = "p-3";

export function BuilderPanel({
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
      <div className={cn(builderPanelSurfaceClass, className)}>
        <div className={builderPanelHeaderClass}>{title}</div>
        <div
          className={cn(
            "flex min-h-0 flex-1 flex-col overflow-hidden",
            contentClassName,
          )}
        >
          <ScrollArea className="min-h-0 min-w-0 flex-1">
            <div className={cn(builderPanelBodyClass, bodyClassName)}>
              {children}
            </div>
          </ScrollArea>
        </div>
      </div>
    );
  }

  return (
    <Collapsible
      className={cn(builderPanelSurfaceClass, className)}
      onOpenChange={setOpen}
      open={open}
    >
      <CollapsibleTrigger
        className={cn(
          builderPanelHeaderClass,
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
          "flex min-h-0 flex-col overflow-hidden data-[state=closed]:hidden",
          contentClassName,
        )}
      >
        <ScrollArea className="min-h-0 min-w-0 flex-1">
          <div className={cn(builderPanelBodyClass, bodyClassName)}>
            {children}
          </div>
        </ScrollArea>
      </CollapsibleContent>
    </Collapsible>
  );
}
