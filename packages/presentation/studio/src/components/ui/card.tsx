import type * as React from "react";

import { cn } from "../../lib/cn.js";

function Card({
  className,
  size = "default",
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & {
  size?: "default" | "sm";
  variant?: "default" | "dragPreview";
}) {
  const resolvedSize = variant === "dragPreview" ? "default" : size;

  return (
    <div
      className={cn(
        "group/card flex flex-col gap-4 overflow-hidden rounded-none bg-card py-4 text-xs/relaxed text-card-foreground ring-1 ring-foreground/10 has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=sm]:gap-2 data-[size=sm]:py-3 data-[size=sm]:has-data-[slot=card-footer]:pb-0 *:[img:first-child]:rounded-none *:[img:last-child]:rounded-none",
        variant === "dragPreview" &&
          "pointer-events-none w-fit max-w-[min(100vw-2rem,180px)] gap-0 rounded-md border border-border/70 bg-card/90 py-2 ring-0 backdrop-blur-[1px]",
        className,
      )}
      data-size={resolvedSize}
      data-variant={variant}
      data-slot="card"
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "group/card-header @container/card-header grid auto-rows-min items-start gap-1 rounded-none px-4 group-data-[size=sm]/card:px-3 has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-4 group-data-[size=sm]/card:[.border-b]:pb-3",
        className,
      )}
      data-slot="card-header"
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "font-heading text-sm font-medium group-data-[size=sm]/card:text-sm",
        className,
      )}
      data-slot="card-title"
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("text-xs/relaxed text-muted-foreground", className)}
      data-slot="card-description"
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "px-4 group-data-[size=sm]/card:px-3 group-data-[variant=dragPreview]/card:flex group-data-[variant=dragPreview]/card:items-center group-data-[variant=dragPreview]/card:gap-1.5 group-data-[variant=dragPreview]/card:px-2",
        className,
      )}
      data-slot="card-content"
      {...props}
    />
  );
}

export { Card, CardContent, CardDescription, CardHeader, CardTitle };
