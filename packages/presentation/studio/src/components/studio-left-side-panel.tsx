import { cva } from "class-variance-authority";
import type { ReactNode } from "react";

import { cn } from "../lib/cn.js";
import { ScrollArea } from "./scroll-area.js";
import {
  studioPanelBodyClass,
  studioPanelHeaderClass,
  studioPanelSurfaceClass,
} from "./studio-panel-chrome.js";

const studioLeftSidePanelHeaderVariants = cva(
  cn(studioPanelHeaderClass, "shrink-0"),
  {
    variants: {
      variant: {
        /** Title row only (Primitives, Layers, Components). */
        default: "",
        /** Title plus non-scrolling toolbar (e.g. template list filter). */
        toolbar:
          "flex flex-col items-stretch gap-2.5 pb-3 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground/95",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export type StudioLeftSidePanelProps = {
  title: string;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  headerClassName?: string;
  contentClassName?: string;
  /** Renders below the title inside the header chrome (not in the scroll region). */
  toolbar?: ReactNode;
};

/**
 * Shared shell for the left Studio rail panels. {@link studio-panel#StudioPanel}
 * delegates its non-collapsible layout here; variants cover optional header toolbars.
 */
export function StudioLeftSidePanel({
  title,
  children,
  className,
  bodyClassName,
  headerClassName,
  contentClassName,
  toolbar,
}: StudioLeftSidePanelProps) {
  const headerVariant = toolbar ? "toolbar" : "default";

  return (
    <div className={cn(studioPanelSurfaceClass, className)}>
      <div
        className={cn(
          studioLeftSidePanelHeaderVariants({
            variant: headerVariant,
          }),
          headerClassName,
        )}
      >
        <div className="min-w-0">{title}</div>
        {toolbar ? <div className="normal-case">{toolbar}</div> : null}
      </div>
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
