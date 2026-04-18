"use client";

import { useDraggable } from "@dnd-kit/core";
import { IconComponents } from "@tabler/icons-react";
import { useEffect, useState } from "react";

import { useTapInsertion } from "../../lib/tap-insertion-context.js";
import { StudioPaletteTile } from "./studio-palette-tile.js";

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
  const tapInsertion = useTapInsertion();
  const armed =
    tapInsertion.enabled &&
    tapInsertion.staged?.definitionKey === "primitive.libraryComponent" &&
    tapInsertion.staged.libraryComponentKey === item.key;

  const onTap = tapInsertion.enabled
    ? () => {
        if (armed) {
          tapInsertion.cancel();
        } else {
          tapInsertion.stage({
            definitionKey: "primitive.libraryComponent",
            libraryComponentKey: item.key,
          });
        }
      }
    : undefined;

  return (
    <StudioPaletteTile
      armed={armed}
      Icon={IconComponents}
      attributes={attributes}
      isDragging={isDragging}
      label={item.displayName}
      labelCapitalize={false}
      listeners={listeners}
      onTap={onTap}
      tileRef={setNodeRef}
    />
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
