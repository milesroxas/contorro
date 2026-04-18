"use client";

import type { DraggableAttributes } from "@dnd-kit/core";
import type { Icon } from "@tabler/icons-react";
import { type PointerEvent, type Ref, useEffect, useRef } from "react";

import { cn } from "../../lib/cn.js";

/**
 * Single layout for draggable palette tiles (Primitives + Components).
 * Keep button + label spacing identical across both sidebars.
 *
 * Mobile tap-to-insert: when `armed` is true the tile renders as the currently
 * staged primitive. Tapping an already-armed tile clears the staged insertion.
 */
export function StudioPaletteTile({
  Icon,
  armed = false,
  attributes,
  dataTestId,
  isDragging,
  label,
  labelCapitalize,
  listeners,
  onTap,
  tileRef,
}: {
  Icon: Icon;
  /** Highlighted state while the tile is the staged tap-to-insert choice. */
  armed?: boolean;
  attributes: DraggableAttributes;
  dataTestId?: string;
  isDragging: boolean;
  label: string;
  /** Primitives use Tailwind `capitalize`; library display names stay as authored. */
  labelCapitalize: boolean;
  listeners: Record<string, unknown> | undefined;
  /**
   * Click handler that only fires when the press did not become a drag. Used on
   * mobile to toggle tap-to-insert staging without interfering with @dnd-kit.
   */
  onTap?: () => void;
  tileRef: Ref<HTMLButtonElement | null>;
}) {
  const baseClassName = cn(
    "flex flex-col items-center gap-2 rounded-lg border p-3 text-center transition-colors",
    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
    "min-h-[5.5rem]",
    armed
      ? "border-primary bg-primary/10 shadow-[0_0_0_1px_hsl(var(--primary)/0.55)]"
      : "border-border bg-card hover:border-primary/30 hover:bg-accent/50",
    isDragging && "cursor-grabbing opacity-50",
    !isDragging && "cursor-grab",
  );

  // `useDraggable` installs pointer-down listeners that prevent a synthetic
  // click from firing when pointer-up lands on the same tile. We capture the
  // start/end positions ourselves so tap-to-insert works without a click event.
  //
  // Drag sensors (TouchSensor in particular) take over once activation fires,
  // so we read the latest `isDragging` via a ref at pointer-up time and skip
  // the tap if a drag has begun.
  const isDraggingRef = useRef(isDragging);
  useEffect(() => {
    isDraggingRef.current = isDragging;
  }, [isDragging]);

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (!onTap) {
      return;
    }
    const el = event.currentTarget;
    const startX = event.clientX;
    const startY = event.clientY;
    const startTime = Date.now();
    const cleanup = () => {
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onCancel);
    };
    const onUp = (upEvent: globalThis.PointerEvent) => {
      cleanup();
      if (isDraggingRef.current) {
        return;
      }
      const dx = upEvent.clientX - startX;
      const dy = upEvent.clientY - startY;
      const movedPx = Math.sqrt(dx * dx + dy * dy);
      const elapsed = Date.now() - startTime;
      // Short, steady presses are taps; longer or wider gestures belong to
      // the TouchSensor's drag-activation window (delay 180ms, tolerance 8).
      if (movedPx <= 6 && elapsed <= 220) {
        onTap();
      }
    };
    const onCancel = () => {
      cleanup();
    };
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onCancel);
  };

  return (
    <button
      className={baseClassName}
      data-armed={armed ? "true" : undefined}
      data-testid={dataTestId}
      ref={tileRef}
      type="button"
      {...listeners}
      {...attributes}
      aria-pressed={armed || undefined}
      onPointerDown={(event) => {
        (
          listeners as { onPointerDown?: (e: PointerEvent) => void }
        )?.onPointerDown?.(event);
        if (!event.defaultPrevented) {
          handlePointerDown(event);
        }
      }}
    >
      <Icon
        aria-hidden
        className={cn(
          "size-6.5",
          armed ? "text-primary" : "text-muted-foreground",
        )}
        stroke={1.25}
      />
      <span
        className={cn(
          "line-clamp-2 text-[13px] leading-tight font-medium",
          armed ? "text-primary" : "text-foreground",
          labelCapitalize ? "capitalize" : "normal-case",
        )}
      >
        {label}
      </span>
    </button>
  );
}
