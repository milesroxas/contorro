import type * as React from "react";

import { cn } from "../../lib/cn.js";

export function Separator({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("h-px w-full shrink-0 bg-border", className)}
      {...props}
    />
  );
}
