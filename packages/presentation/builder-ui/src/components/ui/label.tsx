import type * as React from "react";

import { cn } from "../../lib/cn.js";

function Label({
  className,
  htmlFor,
  ...props
}: React.ComponentProps<"label">) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: thin primitive; callers pair with controls via htmlFor
    <label
      data-slot="label"
      htmlFor={htmlFor}
      className={cn(
        "text-sm font-medium leading-snug text-foreground select-none",
        "peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className,
      )}
      {...props}
    />
  );
}

export { Label };
