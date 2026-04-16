"use client";

import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "../lib/cn.js";

/**
 * Root wrapper for Studio UI. Provides the `.studio-root` layout hook for CSS.
 * Overlay components use Radix default portals (typically `document.body`).
 */
export function StudioRoot({
  children,
  className,
  ...props
}: Omit<ComponentPropsWithoutRef<"div">, "children"> & {
  children: ReactNode;
}) {
  return (
    <div {...props} className={cn("studio-root relative", className)}>
      {children}
    </div>
  );
}
