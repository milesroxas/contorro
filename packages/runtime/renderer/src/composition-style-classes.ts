import {
  BREAKPOINTS,
  type Breakpoint,
  STYLE_PROPERTY_KEYS,
  type StyleProperty,
  utilityValuesForStyleProperty,
} from "@repo/contracts-zod";

/**
 * Maps a persisted style utility (property + value) to a single Tailwind class.
 * Single source of truth for composition style resolution and Tailwind safelist.
 */
export function utilityClassNameForPropertyValue(
  property: StyleProperty,
  value: string,
): string | null {
  switch (property) {
    case "borderColor":
      return `border-${value}`;
    case "borderRadius":
      return `rounded-${value}`;
    case "borderStyle":
      return `border-${value}`;
    case "borderWidth":
      return value === "DEFAULT" ? "border" : `border-${value}`;
    case "display":
      return value;
    case "fontFamily":
      return `font-${value}`;
    case "fontSize":
      return `text-${value}`;
    case "fontWeight":
      return `font-${value}`;
    case "textAlign":
      return `text-${value}`;
    case "lineHeight":
      return `leading-${value}`;
    case "letterSpacing":
      return `tracking-${value}`;
    case "textTransform":
      return value;
    case "fontStyle":
      return value;
    case "textDecorationLine":
      return value;
    case "flexDirection":
      return `flex-${value}`;
    case "flexWrap":
      return `flex-${value}`;
    case "justifyContent":
      return `justify-${value}`;
    case "alignItems":
      return `items-${value}`;
    case "alignSelf":
      return `self-${value}`;
    case "flex":
      return `flex-${value}`;
    case "flexGrow":
      return value === "0" ? "grow-0" : "grow";
    case "flexShrink":
      return value === "0" ? "shrink-0" : "shrink";
    case "flexBasis":
      return value === "prose"
        ? "basis-[var(--container-prose)]"
        : `basis-${value}`;
    case "order":
      return `order-${value}`;
    case "overflow":
      return `overflow-${value}`;
    case "overflowX":
      return `overflow-x-${value}`;
    case "overflowY":
      return `overflow-y-${value}`;
    case "padding":
      return `p-${value}`;
    case "paddingTop":
      return `pt-${value}`;
    case "paddingRight":
      return `pr-${value}`;
    case "paddingBottom":
      return `pb-${value}`;
    case "paddingLeft":
      return `pl-${value}`;
    case "gap":
      return `gap-${value}`;
    case "margin":
      return `m-${value}`;
    case "marginTop":
      return `mt-${value}`;
    case "marginRight":
      return `mr-${value}`;
    case "marginBottom":
      return `mb-${value}`;
    case "marginLeft":
      return `ml-${value}`;
    case "width":
      return value === "container" ? "container" : `w-${value}`;
    case "minWidth":
      return `min-w-${value}`;
    case "maxWidth":
      return `max-w-${value}`;
    case "height":
      return `h-${value}`;
    case "minHeight":
      return `min-h-${value}`;
    case "maxHeight":
      return `max-h-${value}`;
    case "aspectRatio":
      return `aspect-${value}`;
    default:
      return null;
  }
}

/** Tailwind responsive prefix for persisted breakpoint keys (`sm:`, `md:`, …). */
export function tailwindBreakpointPrefix(breakpoint: Breakpoint): string {
  return `${breakpoint}:`;
}

export function withBreakpointPrefix(
  breakpoint: Breakpoint | null,
  className: string,
): string {
  return breakpoint
    ? `${tailwindBreakpointPrefix(breakpoint)}${className}`
    : className;
}

/**
 * Every utility class the composition resolver may emit (base + `sm:`/`md:`/`lg:`/`xl:`),
 * for Tailwind `@source inline` safelist generation.
 */
export function listCompositionUtilitySafelistClasses(): string[] {
  const out = new Set<string>();
  for (const property of STYLE_PROPERTY_KEYS) {
    for (const value of utilityValuesForStyleProperty(property)) {
      const cls = utilityClassNameForPropertyValue(property, value);
      if (!cls) {
        continue;
      }
      out.add(cls);
      for (const bp of BREAKPOINTS) {
        out.add(withBreakpointPrefix(bp, cls));
      }
    }
  }
  return [...out];
}
