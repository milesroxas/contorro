/**
 * Canonical resolution for primitives that store media like the image primitive:
 * `src` is primary; `mediaUrl` is set when choosing Payload media and should match.
 */
export function resolvedPrimitiveMediaSrc(
  propValues: Record<string, unknown> | null | undefined,
): string {
  if (!propValues) {
    return "";
  }
  const src = propValues.src;
  if (typeof src === "string" && src.trim().length > 0) {
    return src;
  }
  const mediaUrl = propValues.mediaUrl;
  if (typeof mediaUrl === "string" && mediaUrl.trim().length > 0) {
    return mediaUrl;
  }
  return "";
}
