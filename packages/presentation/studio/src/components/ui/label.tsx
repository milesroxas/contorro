import type * as React from "react";

import { cn } from "../../lib/cn.js";

function Label({
  className,
  htmlFor,
  children,
  ...props
}: React.ComponentProps<"label">) {
  const classes = cn(
    "text-sm font-medium leading-snug text-foreground select-none",
    "peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
    className,
  );
  if (htmlFor !== undefined && htmlFor !== "") {
    return (
      <label className={classes} data-slot="label" htmlFor={htmlFor} {...props}>
        {children}
      </label>
    );
  }
  return (
    <span className={classes} data-slot="label" {...props}>
      {children}
    </span>
  );
}

export { Label };
