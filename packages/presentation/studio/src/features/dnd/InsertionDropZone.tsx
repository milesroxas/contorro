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
  droppableScope,
}: {
  parentId: string;
  insertIndex: number;
  variant: "between" | "empty";
  className?: string;
  testId?: string;
  /** Canvas and layers tree both render insert zones; ids must stay unique per @dnd-kit/core. */
  droppableScope: "canvas" | "layers";
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `${droppableScope}-insert:${parentId}:${insertIndex}`,
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
        variant === "between" && "z-3",
        variant === "empty" &&
          cn(
            "min-h-[4.5rem] flex-1",
            droppableScope === "canvas" ? "p-3" : "py-2",
          ),
        className,
      )}
      data-testid={testId}
      ref={setNodeRef}
    >
      {variant === "between" ? (
        <div
          className={cn(
            "pointer-events-none flex w-full items-center justify-center rounded-md transition-all",
            isOver
              ? "min-h-8 border-2 border-dashed border-primary bg-primary/15 py-1 shadow-md ring-2 ring-primary/30"
              : "min-h-2 border border-transparent bg-transparent py-0",
          )}
        />
      ) : (
        <div
          className={cn(
            "pointer-events-none flex h-full min-h-[4.5rem] items-center justify-center rounded-lg border-2 border-dashed px-4 py-5 text-center text-sm font-semibold tracking-tight transition-all",
            isOver
              ? "border-primary bg-primary/15 text-primary shadow-inner ring-2 ring-primary/25"
              : "border-muted-foreground/45 bg-muted/40 text-muted-foreground shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] dark:border-muted-foreground/50 dark:bg-muted/35 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]",
          )}
        >
          Drop elements here
        </div>
      )}
    </div>
  );
}
