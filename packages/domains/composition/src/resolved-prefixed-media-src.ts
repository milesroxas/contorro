/**
 * Like {@link resolvedPrimitiveMediaSrc} but uses explicit prop keys, e.g.
 * `backgroundImageSrc` / `backgroundImageMediaUrl` for box background.
 */
export function resolvedPrefixedMediaSrc(
  propValues: Record<string, unknown> | null | undefined,
  srcKey: string,
  mediaUrlKey: string,
): string {
  if (!propValues) {
    return "";
  }
  const src = propValues[srcKey];
  if (typeof src === "string" && src.trim().length > 0) {
    return src.trim();
  }
  const mediaUrl = propValues[mediaUrlKey];
  if (typeof mediaUrl === "string" && mediaUrl.trim().length > 0) {
    return mediaUrl.trim();
  }
  return "";
}

export function cssUrlDeclaration(url: string): string {
  const escaped = url.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `url("${escaped}")`;
}
