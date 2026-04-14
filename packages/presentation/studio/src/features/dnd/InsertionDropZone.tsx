"use client";

import { useDndContext, useDroppable } from "@dnd-kit/core";

import { cn } from "../../lib/cn.js";

export type InsertDropData = {
  kind: "insert";
  parentId: string;
  insertIndex: number;
};

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Drop zone states are intentionally explicit for canvas and layers parity.
export function InsertionDropZone({
  parentId,
  insertIndex,
  variant,
  className,
  testId,
  droppableScope,
  showNestedBoxPlaceholder = false,
}: {
  parentId: string;
  insertIndex: number;
  variant: "between" | "empty";
  className?: string;
  testId?: string;
  /** Canvas and layers tree both render insert zones; ids must stay unique per @dnd-kit/core. */
  droppableScope: "canvas" | "layers";
  showNestedBoxPlaceholder?: boolean;
}) {
  const { active } = useDndContext();
  const hasActiveDrag =
    active?.data.current?.kind === "palette" ||
    active?.data.current?.kind === "node";
  const showCanvasDropCue = droppableScope === "canvas" ? hasActiveDrag : true;
  const { setNodeRef, isOver } = useDroppable({
    id: `${droppableScope}-insert:${parentId}:${insertIndex}`,
    data: {
      kind: "insert",
      parentId,
      insertIndex,
    } satisfies InsertDropData,
  });
  if (!showCanvasDropCue) {
    return null;
  }
  const isLayersScope = droppableScope === "layers";
  const emptyContainerSpacingClass = isLayersScope
    ? "min-h-[2.625rem] py-0.5"
    : "min-h-[4rem] p-2.5";
  const betweenStateClass = isOver
    ? isLayersScope
      ? "min-h-5 border border-dashed border-primary bg-primary/15 py-0 shadow-md ring-1 ring-primary/30"
      : "min-h-7 border border-dashed border-primary bg-primary/15 py-0.5 shadow-md ring-1 ring-primary/30"
    : isLayersScope
      ? "min-h-1 border border-transparent bg-transparent py-0"
      : "min-h-1.5 border border-transparent bg-transparent py-0";
  const emptySurfaceClass = isLayersScope
    ? "min-h-[2.625rem] rounded-sm px-2.5 py-1.5 text-xs"
    : "min-h-[4rem] rounded-sm px-3.5 py-4 text-sm";
  const emptyStateClass = isOver
    ? "border-primary bg-primary/15 text-primary shadow-inner ring-1 ring-primary/25"
    : "border-muted-foreground/45 bg-muted/40 text-muted-foreground shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] dark:border-muted-foreground/50 dark:bg-muted/35 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]";
  const renderNestedBoxPlaceholder = showNestedBoxPlaceholder && !isLayersScope;
  const nestedInnerStateClass = isOver
    ? "border-primary/70 bg-primary/12 text-primary"
    : "border-muted-foreground/45 bg-background/45 text-muted-foreground dark:bg-background/30";

  return (
    <div
      className={cn(
        "relative shrink-0 transition-colors",
        variant === "between" && "z-3",
        variant === "empty" && cn("flex-1", emptyContainerSpacingClass),
        className,
      )}
      data-testid={testId}
      ref={setNodeRef}
    >
      {variant === "between" ? (
        <div
          className={cn(
            "pointer-events-none flex w-full items-center justify-center rounded-sm transition-all",
            betweenStateClass,
          )}
        >
          {isOver && !isLayersScope ? (
            <span className="rounded-full border border-primary/40 bg-background/95 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-primary shadow-sm">
              Drop on parent
            </span>
          ) : null}
        </div>
      ) : (
        <div
          className={cn(
            "pointer-events-none flex h-full border border-dashed text-center font-semibold tracking-tight transition-all",
            emptySurfaceClass,
            emptyStateClass,
            renderNestedBoxPlaceholder
              ? "items-stretch justify-stretch p-1.5"
              : "items-center justify-center",
          )}
        >
          {renderNestedBoxPlaceholder ? (
            <div
              className={cn(
                "flex h-full w-full min-h-[3rem] items-center justify-center rounded-sm border border-dashed text-center font-semibold tracking-tight transition-colors",
                nestedInnerStateClass,
              )}
            >
              {isOver ? "Nest inside parent" : "Drop elements here"}
            </div>
          ) : isOver && !isLayersScope ? (
            "Drop into parent"
          ) : (
            "Drop elements here"
          )}
        </div>
      )}
    </div>
  );
}
