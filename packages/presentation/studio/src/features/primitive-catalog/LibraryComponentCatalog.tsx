"use client";

import { useDraggable } from "@dnd-kit/core";
import { IconComponents } from "@tabler/icons-react";
import { useEffect, useState } from "react";

import { cn } from "../../lib/cn.js";

type Item = { key: string; displayName: string };

function LibraryPaletteTile({ item }: { item: Item }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-lib-${item.key}`,
    data: {
      kind: "palette" as const,
      definitionKey: "primitive.libraryComponent",
      libraryComponentKey: item.key,
      displayName: item.displayName,
    },
  });

  return (
    <button
      className={cn(
        "flex w-full flex-col items-center gap-2 rounded-lg border border-border bg-card p-3 text-center shadow-sm transition-colors",
        "hover:border-primary/30 hover:bg-accent/50",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        isDragging && "cursor-grabbing opacity-50",
        !isDragging && "cursor-grab",
      )}
      ref={setNodeRef}
      type="button"
      {...listeners}
      {...attributes}
    >
      <IconComponents
        aria-hidden
        className="size-6.5 text-muted-foreground"
        stroke={1.25}
      />
      <span className="line-clamp-2 min-h-8 text-[15px] leading-tight font-medium text-foreground">
        {item.displayName}
      </span>
    </button>
  );
}

export function LibraryComponentCatalog() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/studio/library-components", {
          credentials: "include",
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const json = (await res.json()) as {
          data?: { items?: Item[] };
        };
        const list = json.data?.items ?? [];
        if (!cancelled) {
          setItems(list);
          setLoadError(null);
        }
      } catch {
        if (!cancelled) {
          setItems([]);
          setLoadError("Could not load components.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const grid =
    items === null ? (
      <div className="text-xs text-muted-foreground">Loading…</div>
    ) : items.length === 0 ? (
      <div className="text-xs leading-snug text-muted-foreground">
        {loadError ??
          "No library components with a saved layout yet. Publish a component first."}
      </div>
    ) : (
      <div className="grid grid-cols-2 gap-2">
        {items.map((item) => (
          <LibraryPaletteTile item={item} key={item.key} />
        ))}
      </div>
    );

  return grid;
}
