/** Avoids collisions with page template ids in `builder.compositions` (numeric ids overlap across tables). */
export function builderRowIdForComponent(componentId: string): string {
  return `cmp-${componentId}`;
}
