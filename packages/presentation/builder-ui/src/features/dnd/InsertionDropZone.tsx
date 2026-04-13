"use client";

import { useDroppable } from "@dnd-kit/core";

import { cn } from "../../lib/cn.js";

export type InsertDropData = {
  kind: "insert";
  parentId: string;
  insertIndex: number;
};

export function InsertionDropZone({
  parentId,
  insertIndex,
  variant,
  className,
  testId,
}: {
  parentId: string;
  insertIndex: number;
  variant: "between" | "empty";
  className?: string;
  testId?: string;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `insert:${parentId}:${insertIndex}`,
    data: {
      kind: "insert",
      parentId,
      insertIndex,
    } satisfies InsertDropData,
  });

  return (
    <div
      className={cn(
        "relative shrink-0 transition-colors",
        variant === "between" && "z-3 py-px",
        variant === "empty" && "min-h-[4.5rem] flex-1 py-2",
        className,
      )}
      data-testid={testId}
      ref={setNodeRef}
    >
      {variant === "between" ? (
        <div
          className={cn(
            "pointer-events-none flex w-full items-center justify-center rounded-md border-2 border-dashed transition-all",
            isOver
              ? "min-h-8 border-primary bg-primary/15 py-1 shadow-md ring-2 ring-primary/30"
              : "min-h-1 border-transparent bg-transparent py-0",
          )}
        />
      ) : (
        <div className="pointer-events-none flex h-full min-h-[4rem] items-center justify-center rounded-md border border-dashed border-border/80 bg-muted/15 px-3 text-center text-sm font-medium text-muted-foreground dark:bg-muted/25">
          Drop elements here
        </div>
      )}
    </div>
  );
}
