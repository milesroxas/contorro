"use client";

import { useDraggable } from "@dnd-kit/core";
import { IconGripVertical } from "@tabler/icons-react";

import { cn } from "../../lib/cn.js";

export function NodeDragHandle({
  nodeId,
  disabled,
}: {
  nodeId: string;
  disabled?: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `move:${nodeId}`,
    disabled,
    data: { kind: "node", nodeId },
  });

  return (
    <button
      aria-label="Drag to move"
      className={cn(
        "inline-flex h-8 w-6 shrink-0 items-center justify-center rounded-md border border-transparent text-muted-foreground/90",
        "hover:border-border/60 hover:bg-muted/70 hover:text-foreground",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:outline-none",
        isDragging && "cursor-grabbing",
        !isDragging && "cursor-grab",
        disabled && "pointer-events-none opacity-0",
      )}
      ref={setNodeRef}
      type="button"
      {...listeners}
      {...attributes}
    >
      <IconGripVertical className="size-3" stroke={1.5} />
    </button>
  );
}
