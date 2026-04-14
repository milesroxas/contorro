/** Resolves the live `contentSlots` array from form/document data (drafts may mirror under `version`). */
export function contentSlotsArrayFromDocumentLike(data: unknown): unknown {
  if (!data || typeof data !== "object") {
    return undefined;
  }
  const row = data as {
    contentSlots?: unknown;
    version?: { contentSlots?: unknown };
  };
  const top = row.contentSlots;
  const ver = row.version?.contentSlots;
  if (Array.isArray(top)) {
    return top;
  }
  if (Array.isArray(ver)) {
    return ver;
  }
  return top !== undefined ? top : ver;
}
