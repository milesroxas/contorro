import type { Icon } from "@tabler/icons-react";
import {
  IconBox,
  IconLayoutGrid,
  IconLayoutList,
  IconPhoto,
  IconTypography,
} from "@tabler/icons-react";

export const PRIMITIVE_KEYS = [
  "primitive.box",
  "primitive.text",
  "primitive.stack",
  "primitive.grid",
  "primitive.image",
] as const;

const META: Record<string, { label: string; Icon: Icon }> = {
  "primitive.box": { label: "Box", Icon: IconBox },
  "primitive.text": { label: "Text", Icon: IconTypography },
  "primitive.stack": { label: "Stack", Icon: IconLayoutList },
  "primitive.grid": { label: "Grid", Icon: IconLayoutGrid },
  "primitive.image": { label: "Image", Icon: IconPhoto },
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
