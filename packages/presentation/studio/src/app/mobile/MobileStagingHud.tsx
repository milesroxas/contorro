"use client";

import { IconArrowBigDownFilled, IconX } from "@tabler/icons-react";

import { Button } from "../../components/ui/button.js";

/**
 * Floating banner shown while a palette item is armed for tap-to-insert on
 * mobile. Sits above the dock so the drop zones remain visible under it.
 */
export function MobileStagingHud({
  label,
  onCancel,
}: {
  label: string;
  onCancel: () => void;
}) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none absolute inset-x-0 bottom-2 z-20 flex justify-center px-3"
    >
      <div className="pointer-events-auto flex min-w-0 max-w-full items-center gap-2 rounded-full border border-primary/60 bg-primary text-primary-foreground shadow-lg">
        <span className="flex items-center gap-1.5 pl-3 text-xs font-medium">
          <IconArrowBigDownFilled aria-hidden className="size-4 shrink-0" />
          <span className="truncate">Tap a drop zone to place {label}</span>
        </span>
        <Button
          aria-label="Cancel insertion"
          className="h-8 rounded-full border-0 bg-transparent text-primary-foreground hover:bg-primary/80"
          onClick={onCancel}
          size="sm"
          type="button"
          variant="ghost"
        >
          <IconX aria-hidden className="size-4" />
          Cancel
        </Button>
      </div>
    </div>
  );
}
