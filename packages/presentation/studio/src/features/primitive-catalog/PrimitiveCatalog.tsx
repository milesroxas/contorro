"use client";

import { useDraggable } from "@dnd-kit/core";

import {
  getPrimitiveDisplay,
  PRIMITIVE_KEYS,
} from "../../lib/primitive-display.js";
import { useTapInsertion } from "../../lib/tap-insertion-context.js";
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
  const tapInsertion = useTapInsertion();
  const armed =
    tapInsertion.enabled &&
    tapInsertion.staged?.definitionKey === definitionKey &&
    tapInsertion.staged.libraryComponentKey === undefined;

  const onTap = tapInsertion.enabled
    ? () => {
        if (armed) {
          tapInsertion.cancel();
        } else {
          tapInsertion.stage({ definitionKey });
        }
      }
    : undefined;

  return (
    <StudioPaletteTile
      armed={armed}
      Icon={Icon}
      attributes={attributes}
      dataTestId={`palette-${label.toLowerCase()}`}
      isDragging={isDragging}
      label={label}
      labelCapitalize
      listeners={listeners}
      onTap={onTap}
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
