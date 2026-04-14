const COMPONENT_ROW_PREFIX = "cmp-";

/** Namespace component docs so Studio composition ids never collide with page template numeric ids (`cmp-<payloadId>`). */
export function studioRowIdForComponent(componentId: string): string {
  return `${COMPONENT_ROW_PREFIX}${componentId}`;
}

export function componentIdFromStudioRowId(rowId: string): string | null {
  if (!rowId.startsWith(COMPONENT_ROW_PREFIX)) {
    return null;
  }
  const id = rowId.slice(COMPONENT_ROW_PREFIX.length);
  return id.length > 0 ? id : null;
}

export function isStudioComponentRowId(rowId: string): boolean {
  return componentIdFromStudioRowId(rowId) !== null;
}
