const LEGACY_OBJECT_FIT_TO_UTILITY: Readonly<Record<string, string>> = {
  cover: "object-cover",
  contain: "object-contain",
  fill: "object-fill",
  none: "object-none",
  "scale-down": "object-scale-down",
};

/**
 * Tailwind class string for `<img>`: canonical `imageUtilities`, with legacy
 * `objectFit` prop values mapped when `imageUtilities` is unset.
 */
export function imageTailwindUtilitiesFromPropValues(
  propValues: Record<string, unknown> | undefined,
): string {
  const direct = propValues?.imageUtilities;
  if (typeof direct === "string" && direct.trim() !== "") {
    return direct.trim();
  }
  const legacyFit = propValues?.objectFit;
  if (typeof legacyFit === "string" && legacyFit.length > 0) {
    return LEGACY_OBJECT_FIT_TO_UTILITY[legacyFit] ?? "object-cover";
  }
  return "object-cover";
}
