"use client";

import type * as React from "react";

import { cn } from "../../lib/cn.js";

function Checkbox({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type="checkbox"
      data-slot="checkbox"
      className={cn(
        "size-4 shrink-0 cursor-pointer rounded-sm border border-input bg-background accent-primary shadow-sm outline-none",
        "focus-visible:ring-1 focus-visible:ring-ring/50",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Checkbox };
