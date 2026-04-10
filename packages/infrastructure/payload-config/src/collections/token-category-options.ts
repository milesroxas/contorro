/** Mirrors `TOKEN_CATEGORY_SCHEMA` in `@repo/contracts-zod` (spec §5.3). */
export const tokenCategoryFieldOptions = [
  { label: "Color", value: "color" },
  { label: "Space", value: "space" },
  { label: "Size", value: "size" },
  { label: "Radius", value: "radius" },
  { label: "Typography", value: "typography" },
  { label: "Shadow", value: "shadow" },
  { label: "Border", value: "border" },
  { label: "Z-index", value: "zIndex" },
  { label: "Opacity", value: "opacity" },
  { label: "Transition", value: "transition" },
  { label: "Breakpoint", value: "breakpoint" },
  { label: "Container", value: "container" },
] as const;
