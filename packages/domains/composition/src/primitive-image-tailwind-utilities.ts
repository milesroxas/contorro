/**
 * Tailwind class string for `<img>` from `imageUtilities` prop, or `object-cover` when unset.
 */
export function imageTailwindUtilitiesFromPropValues(
  propValues: Record<string, unknown> | undefined,
): string {
  const direct = propValues?.imageUtilities;
  if (typeof direct === "string" && direct.trim() !== "") {
    return direct.trim();
  }
  return "object-cover";
}
