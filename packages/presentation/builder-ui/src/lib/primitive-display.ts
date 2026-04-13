import { BUILDER_PALETTE_PRIMITIVE_KEYS } from "@repo/domains-composition";
import type { Icon } from "@tabler/icons-react";
import {
  IconBox,
  IconComponents,
  IconLayoutGrid,
  IconLayoutList,
  IconPhoto,
  IconSection,
  IconTypography,
} from "@tabler/icons-react";

export const PRIMITIVE_KEYS = BUILDER_PALETTE_PRIMITIVE_KEYS;

const META: Record<string, { label: string; Icon: Icon }> = {
  "primitive.box": { label: "Box", Icon: IconBox },
  "primitive.text": { label: "Text", Icon: IconTypography },
  "primitive.stack": { label: "Stack", Icon: IconLayoutList },
  "primitive.grid": { label: "Grid", Icon: IconLayoutGrid },
  "primitive.image": { label: "Image", Icon: IconPhoto },
  "primitive.slot": { label: "Slot", Icon: IconSection },
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
  return {
    label: definitionKey.replace("primitive.", ""),
    Icon: IconBox,
  };
}
