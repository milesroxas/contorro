"use client";

import { useDraggable } from "@dnd-kit/core";

import {
  PRIMITIVE_KEYS,
  getPrimitiveDisplay,
} from "../../lib/primitive-display.js";
import { StudioPaletteTile } from "./studio-palette-tile.js";

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
    <StudioPaletteTile
      Icon={Icon}
      attributes={attributes}
      dataTestId={`palette-${label.toLowerCase()}`}
      isDragging={isDragging}
      label={label}
      labelCapitalize
      listeners={listeners}
      tileRef={setNodeRef}
    />
  );
}

export function PrimitiveCatalog() {
  return (
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
}
