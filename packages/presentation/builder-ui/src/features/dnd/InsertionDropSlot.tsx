"use client";

import { useDroppable } from "@dnd-kit/core";

import { cn } from "../../lib/cn.js";

export type InsertDropData = {
  kind: "insert";
  parentId: string;
  slotIndex: number;
};

export function InsertionDropSlot({
  parentId,
  slotIndex,
  variant,
  className,
}: {
  parentId: string;
  slotIndex: number;
  variant: "between" | "empty";
  className?: string;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `insert:${parentId}:${slotIndex}`,
    data: {
      kind: "insert",
      parentId,
      slotIndex,
    } satisfies InsertDropData,
  });

  return (
    <div
      className={cn(
        "relative shrink-0 transition-colors",
        variant === "between" && "z-[3] py-px",
        variant === "empty" && "min-h-[4.5rem] flex-1 py-2",
        className,
      )}
      ref={setNodeRef}
    >
      {variant === "between" ? (
        <div
          className={cn(
            "pointer-events-none flex w-full items-center justify-center rounded-md border-2 border-dashed transition-all",
            isOver
              ? "min-h-9 border-primary bg-primary/15 py-1.5 shadow-md ring-2 ring-primary/30"
              : "min-h-2 border-transparent bg-transparent py-0",
          )}
        />
      ) : (
        <div className="pointer-events-none flex h-full min-h-[4rem] items-center justify-center rounded-md border border-dashed border-border/80 bg-muted/15 px-3 text-center text-xs font-medium text-muted-foreground dark:bg-muted/25">
          Drop elements here
        </div>
      )}
    </div>
  );
}
