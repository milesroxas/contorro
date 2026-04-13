"use client";

import { useDraggable } from "@dnd-kit/core";

import { cn } from "../../lib/cn.js";
import {
  PRIMITIVE_KEYS,
  getPrimitiveDisplay,
} from "../../lib/primitive-display.js";

function PaletteTile({
  definitionKey,
  label,
  Icon,
}: {
  definitionKey: string;
  label: string;
  Icon: ReturnType<typeof getPrimitiveDisplay>["Icon"];
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${definitionKey}`,
    data: { definitionKey, kind: "palette" as const },
  });

  return (
    <button
      className={cn(
        "flex flex-col items-center gap-2 rounded-lg border border-border bg-card p-3 text-center shadow-sm transition-colors",
        "hover:border-primary/30 hover:bg-accent/50",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        isDragging && "cursor-grabbing opacity-50",
        !isDragging && "cursor-grab",
      )}
      data-testid={`palette-${label.toLowerCase()}`}
      ref={setNodeRef}
      type="button"
      {...listeners}
      {...attributes}
    >
      <Icon
        aria-hidden
        className="size-7 text-muted-foreground"
        stroke={1.25}
      />
      <span className="text-sm font-medium text-foreground capitalize">
        {label}
      </span>
    </button>
  );
}

export function PrimitiveCatalog({ embedded = false }: { embedded?: boolean }) {
  const grid = (
    <div className="grid grid-cols-2 gap-2">
      {PRIMITIVE_KEYS.map((definitionKey) => {
        const { label, Icon } = getPrimitiveDisplay(definitionKey);
        return (
          <PaletteTile
            definitionKey={definitionKey}
            Icon={Icon}
            key={definitionKey}
            label={label}
          />
        );
      })}
    </div>
  );

  if (embedded) {
    return grid;
  }

  return (
    <div className="rounded-lg border border-border bg-muted/15 p-3 dark:bg-muted/10">
      <div className="mb-2.5 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
        Primitives
      </div>
      {grid}
    </div>
  );
}
