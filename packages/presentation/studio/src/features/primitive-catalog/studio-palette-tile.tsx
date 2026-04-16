"use client";

import type { DraggableAttributes } from "@dnd-kit/core";
import type { Icon } from "@tabler/icons-react";
import type { Ref } from "react";

import { cn } from "../../lib/cn.js";

/**
 * Single layout for draggable palette tiles (Primitives + Components).
 * Keep button + label spacing identical across both sidebars.
 */
export function StudioPaletteTile({
  Icon,
  attributes,
  dataTestId,
  isDragging,
  label,
  labelCapitalize,
  listeners,
  tileRef,
}: {
  Icon: Icon;
  attributes: DraggableAttributes;
  dataTestId?: string;
  isDragging: boolean;
  label: string;
  /** Primitives use Tailwind `capitalize`; library display names stay as authored. */
  labelCapitalize: boolean;
  listeners: Record<string, unknown> | undefined;
  tileRef: Ref<HTMLButtonElement | null>;
}) {
  return (
    <button
      className={cn(
        "flex flex-col items-center gap-2 rounded-lg border border-border bg-card p-3 text-center transition-colors",
        "hover:border-primary/30 hover:bg-accent/50",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        isDragging && "cursor-grabbing opacity-50",
        !isDragging && "cursor-grab",
      )}
      data-testid={dataTestId}
      ref={tileRef}
      type="button"
      {...listeners}
      {...attributes}
    >
      <Icon
        aria-hidden
        className="size-6.5 text-muted-foreground"
        stroke={1.25}
      />
      <span
        className={cn(
          "line-clamp-2 text-[13px] leading-tight font-medium text-foreground",
          labelCapitalize ? "capitalize" : "normal-case",
        )}
      >
        {label}
      </span>
    </button>
  );
}
