import type { ReactNode } from "react";

import { cn } from "../lib/cn.js";
import { ScrollArea } from "./scroll-area.js";

/** Shared chrome for builder side panels (Primitives, Layers, etc.). */
export const builderPanelSurfaceClass =
  "flex min-h-0 min-w-0 flex-1 basis-0 flex-col overflow-hidden rounded-lg border border-border/80 bg-card/40 text-card-foreground shadow-sm dark:bg-card/25";

export const builderPanelHeaderClass =
  "shrink-0 border-b border-border/60 bg-muted/25 px-3 py-2 text-[0.625rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground dark:bg-muted/15";

export const builderPanelBodyClass = "p-3";

export function BuilderPanel({
  title,
  children,
  className,
  bodyClassName,
}: {
  title: string;
  children: ReactNode;
  className?: string;
  /** Scroll viewport padding; default is tuned for dense trees and catalogs. */
  bodyClassName?: string;
}) {
  return (
    <div className={cn(builderPanelSurfaceClass, className)}>
      <div className={builderPanelHeaderClass}>{title}</div>
      <ScrollArea className="min-h-0 min-w-0 flex-1">
        <div className={cn(builderPanelBodyClass, bodyClassName)}>
          {children}
        </div>
      </ScrollArea>
    </div>
  );
}
