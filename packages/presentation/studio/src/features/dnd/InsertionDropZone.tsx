"use client";

import { useDndContext, useDroppable } from "@dnd-kit/core";
import { IconRowInsertBottom } from "@tabler/icons-react";

import { cn } from "../../lib/cn.js";
import { useTapInsertion } from "../../lib/tap-insertion-context.js";

export type InsertDropData = {
  kind: "insert";
  parentId: string;
  insertIndex: number;
};

function betweenDropCueClass(
  isLayersScope: boolean,
  isOver: boolean,
  tapArmed: boolean,
): string {
  if (isOver) {
    return isLayersScope
      ? "min-h-5 border border-dashed border-primary bg-primary/15 py-0 shadow-md ring-1 ring-primary/30"
      : "min-h-9 border border-dashed border-primary bg-primary/15 py-1 shadow-md ring-1 ring-primary/30";
  }
  if (tapArmed) {
    return isLayersScope
      ? "min-h-6 border border-dashed border-primary/60 bg-primary/8 py-0"
      : "min-h-10 border border-dashed border-primary/60 bg-primary/8 py-1 animate-pulse";
  }
  return isLayersScope
    ? "min-h-1 border border-transparent bg-transparent py-0"
    : "min-h-4 border border-transparent bg-transparent py-0";
}

function emptyDropSurfaceClass(isLayersScope: boolean): string {
  return isLayersScope
    ? "min-h-[2.625rem] rounded-sm px-2.5 py-1.5 text-xs"
    : "min-h-[4rem] rounded-sm px-3.5 py-4 text-sm";
}

function emptyDropStateClass(isOver: boolean): string {
  if (isOver) {
    return "border-primary bg-primary/15 text-primary shadow-inner ring-1 ring-primary/25";
  }
  return "border-muted-foreground/45 bg-muted/40 text-muted-foreground shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] dark:border-muted-foreground/50 dark:bg-muted/35 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]";
}

function nestedBoxInnerClass(isOver: boolean): string {
  if (isOver) {
    return "border-primary/70 bg-primary/12 text-primary";
  }
  return "border-muted-foreground/45 bg-background/45 text-muted-foreground dark:bg-background/30";
}

function emptyContainerSpacingClassName(
  isLayersScope: boolean,
  tapArmed: boolean,
): string {
  if (isLayersScope) {
    return "min-h-[2.625rem] py-0.5";
  }
  if (tapArmed) {
    return "min-h-[5rem] p-3";
  }
  return "min-h-[4rem] p-2.5";
}

function InsertionBetweenDropVisual({
  betweenStateClass,
  isLayersScope,
  isOver,
}: {
  betweenStateClass: string;
  isLayersScope: boolean;
  isOver: boolean;
}) {
  return (
    <div
      className={cn(
        "pointer-events-none flex w-full items-center justify-center rounded-sm transition-all",
        betweenStateClass,
      )}
    >
      {isOver && !isLayersScope ? (
        <IconRowInsertBottom
          aria-hidden
          className="size-7 shrink-0 text-primary drop-shadow-sm dark:drop-shadow-[0_1px_3px_rgb(0_0_0/0.45)]"
          stroke={2.25}
        />
      ) : null}
    </div>
  );
}

function InsertionEmptyDropVisual({
  emptyStateClass,
  emptySurfaceClass,
  isLayersScope,
  isOver,
  nestedInnerStateClass,
  renderNestedBoxPlaceholder,
}: {
  emptyStateClass: string;
  emptySurfaceClass: string;
  isLayersScope: boolean;
  isOver: boolean;
  nestedInnerStateClass: string;
  renderNestedBoxPlaceholder: boolean;
}) {
  return (
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
  );
}

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
  const tapInsertion = useTapInsertion();
  const tapArmed = tapInsertion.enabled && tapInsertion.staged !== null;
  const hasActiveDrag =
    active?.data.current?.kind === "palette" ||
    active?.data.current?.kind === "node";
  const showCanvasDropCue =
    droppableScope === "canvas" ? hasActiveDrag || tapArmed : true;
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
  // Mobile/tap-armed gets larger hit targets so thumbs can land cleanly.
  const emptyContainerSpacingClass = emptyContainerSpacingClassName(
    isLayersScope,
    tapArmed,
  );
  const betweenStateClass = betweenDropCueClass(
    isLayersScope,
    isOver,
    tapArmed && !isLayersScope,
  );
  const emptySurfaceClass = emptyDropSurfaceClass(isLayersScope);
  const emptyStateClass = emptyDropStateClass(isOver);
  const renderNestedBoxPlaceholder = showNestedBoxPlaceholder && !isLayersScope;
  const nestedInnerStateClass = nestedBoxInnerClass(isOver);

  const handleTapCommit = tapArmed
    ? (event: React.MouseEvent<HTMLDivElement>) => {
        event.stopPropagation();
        tapInsertion.commit(parentId, insertIndex);
      }
    : undefined;

  return (
    <div
      className={cn(
        "relative shrink-0 transition-colors",
        variant === "between" && "z-3",
        variant === "between" && !isLayersScope && "py-1",
        variant === "empty" && cn("flex-1", emptyContainerSpacingClass),
        tapArmed && "cursor-copy",
        className,
      )}
      data-testid={testId}
      onClick={handleTapCommit}
      ref={setNodeRef}
    >
      {variant === "between" ? (
        <InsertionBetweenDropVisual
          betweenStateClass={betweenStateClass}
          isLayersScope={isLayersScope}
          isOver={isOver}
        />
      ) : (
        <InsertionEmptyDropVisual
          emptyStateClass={emptyStateClass}
          emptySurfaceClass={emptySurfaceClass}
          isLayersScope={isLayersScope}
          isOver={isOver}
          nestedInnerStateClass={nestedInnerStateClass}
          renderNestedBoxPlaceholder={renderNestedBoxPlaceholder}
        />
      )}
    </div>
  );
}
