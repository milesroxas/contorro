const COMPONENT_ROW_PREFIX = "cmp-";

/** Avoids collisions with page template ids in `builder.compositions` (numeric ids overlap across tables). */
export function builderRowIdForComponent(componentId: string): string {
  return `${COMPONENT_ROW_PREFIX}${componentId}`;
}

export function componentIdFromBuilderRowId(rowId: string): string | null {
  if (!rowId.startsWith(COMPONENT_ROW_PREFIX)) {
    return null;
  }
  const id = rowId.slice(COMPONENT_ROW_PREFIX.length);
  return id.length > 0 ? id : null;
}

export function isBuilderComponentRowId(rowId: string): boolean {
  return componentIdFromBuilderRowId(rowId) !== null;
}
