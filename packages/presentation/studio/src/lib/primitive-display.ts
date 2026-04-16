import { STUDIO_PALETTE_PRIMITIVE_KEYS } from "@repo/domains-composition";
import type { Icon } from "@tabler/icons-react";
import {
  IconBox,
  IconComponents,
  IconH1,
  IconHandClick,
  IconLayoutGrid,
  IconLayoutList,
  IconLayoutRows,
  IconLetterT,
  IconList,
  IconPhoto,
  IconRectangle,
  IconVideo,
} from "@tabler/icons-react";

export const PRIMITIVE_KEYS = STUDIO_PALETTE_PRIMITIVE_KEYS;

const META: Record<string, { label: string; Icon: Icon }> = {
  "primitive.box": { label: "Box", Icon: IconBox },
  "primitive.section": { label: "Section", Icon: IconLayoutRows },
  "primitive.text": { label: "Text", Icon: IconLetterT },
  "primitive.heading": { label: "Heading", Icon: IconH1 },
  "primitive.button": { label: "Button", Icon: IconHandClick },
  "primitive.stack": { label: "Stack", Icon: IconLayoutList },
  "primitive.grid": { label: "Grid", Icon: IconLayoutGrid },
  "primitive.image": { label: "Image", Icon: IconPhoto },
  "primitive.video": { label: "Video", Icon: IconVideo },
  "primitive.collection": { label: "Collection", Icon: IconList },
  "primitive.slot": { label: "Slot", Icon: IconRectangle },
  "primitive.libraryComponent": {
    label: "Library block",
    Icon: IconComponents,
  },
};

export function getPrimitiveDisplay(definitionKey: string): {
  label: string;
  Icon: Icon;
} {
  const m = META[definitionKey];
  if (m) {
    return m;
  }
  const fallback = definitionKey
    .replace("primitive.", "")
    .replace(/([a-z])([A-Z])/g, "$1 $2");
  return {
    label: `${fallback.charAt(0).toUpperCase()}${fallback.slice(1)}`,
    Icon: IconBox,
  };
}
