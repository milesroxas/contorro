import { cssVariableForTokenKey } from "@repo/config-tailwind";
import {
  BREAKPOINTS,
  type Breakpoint,
  type CompositionNode,
  type PageComposition,
  type StyleBinding,
  type StyleProperty,
  type StylePropertyEntry,
  utilityValuesForStyleProperty,
} from "@repo/contracts-zod";
import type { CSSProperties } from "react";

import {
  utilityClassNameForPropertyValue,
  withBreakpointPrefix,
} from "./composition-style-classes.js";

export type ResolvedStyle = {
  classes: string;
  /** Inline `var()` entries for token-bound properties. */
  style: CSSProperties;
};

export type ResolvedNodeStyle = {
  className?: string;
  style?: CSSProperties;
};

type ResolveTarget = {
  classes: Set<string>;
  style: Record<string, string>;
};

const PADDING_SIDE_PROPERTIES: readonly StyleProperty[] = [
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
];

/** React style key for a bound property (`background` binds `background-color`). */
function tokenStyleKey(property: StyleProperty): string {
  return property === "background" ? "backgroundColor" : property;
}

function addStyleEntry(
  target: ResolveTarget,
  property: StyleProperty,
  entry: StylePropertyEntry,
  breakpoint: Breakpoint | null,
): void {
  if (entry.type === "token") {
    // Token bindings resolve to inline `var()` styles against the compiled theme
    // variables. Inline styles cannot vary by media query, so in the mobile-first
    // loop the largest-breakpoint token entry wins at all widths (studio preview
    // flattens the cascade correctly via `resolveStyleBindingAtBreakpoint`).
    // Unknown token keys still emit their `var()` — it computes to nothing but
    // stays debuggable in devtools.
    target.style[tokenStyleKey(property)] =
      `var(${cssVariableForTokenKey(entry.token)})`;
    return;
  }
  if (!utilityValuesForStyleProperty(property).includes(entry.value)) {
    return;
  }
  const utilityClassName = utilityClassNameForPropertyValue(
    property,
    entry.value,
  );
  if (utilityClassName) {
    target.classes.add(withBreakpointPrefix(breakpoint, utilityClassName));
  }
}

/**
 * Emits utility classes / token styles for one breakpoint group (base when `breakpoint`
 * is null), including padding shorthand vs side merging matching Tailwind class semantics.
 */
type BreakpointSegment = Breakpoint | "base";

function segmentChainUpTo(upTo: Breakpoint): BreakpointSegment[] {
  const out: BreakpointSegment[] = ["base"];
  for (const bp of BREAKPOINTS) {
    out.push(bp);
    if (bp === upTo) {
      break;
    }
  }
  return out;
}

function withoutBreakpoint(entry: StylePropertyEntry): StylePropertyEntry {
  if (entry.breakpoint === undefined) {
    return entry;
  }
  return { ...entry, breakpoint: undefined } as StylePropertyEntry;
}

function applyEntryToPreviewMap(
  merged: Map<StyleProperty, StylePropertyEntry>,
  entry: StylePropertyEntry,
): void {
  const normalized = withoutBreakpoint(entry);
  const p = entry.property;
  if (p === "padding") {
    for (const side of PADDING_SIDE_PROPERTIES) {
      merged.delete(side);
    }
    merged.set(p, normalized);
    return;
  }
  if (
    PADDING_SIDE_PROPERTIES.includes(
      p as (typeof PADDING_SIDE_PROPERTIES)[number],
    )
  ) {
    merged.delete("padding");
    merged.set(p, normalized);
    return;
  }
  merged.set(p, normalized);
}

/** Merge mobile-first entries up to `upTo` into a single base-level list for preview. */
function mergedEntriesAtBreakpoint(
  binding: StyleBinding,
  upTo: Breakpoint,
): StylePropertyEntry[] {
  const bySegment = new Map<BreakpointSegment, StylePropertyEntry[]>();
  for (const entry of binding.properties) {
    const key: BreakpointSegment = entry.breakpoint ?? "base";
    const list = bySegment.get(key) ?? [];
    list.push(entry);
    bySegment.set(key, list);
  }

  const merged = new Map<StyleProperty, StylePropertyEntry>();
  for (const segment of segmentChainUpTo(upTo)) {
    const list = bySegment.get(segment);
    if (!list) {
      continue;
    }
    for (const entry of list) {
      applyEntryToPreviewMap(merged, entry);
    }
  }
  return [...merged.values()];
}

function resolvedStyleFromTarget(target: ResolveTarget): ResolvedStyle {
  return {
    classes: [...target.classes].join(" "),
    style: target.style as CSSProperties,
  };
}

/**
 * Like {@link resolveStyleBinding}, but resolves the mobile-first cascade up to `upTo`
 * into unprefixed utilities so preview matches the selected breakpoint regardless of
 * actual viewport width.
 */
export function resolveStyleBindingAtBreakpoint(
  binding: StyleBinding,
  upTo: Breakpoint,
): ResolvedStyle {
  const merged = mergedEntriesAtBreakpoint(binding, upTo);
  const target: ResolveTarget = { classes: new Set(), style: {} };
  resolveStyleEntriesForBreakpoint(merged, null, target);
  return resolvedStyleFromTarget(target);
}

function resolveStyleEntriesForBreakpoint(
  entries: StylePropertyEntry[],
  breakpoint: Breakpoint | null,
  target: ResolveTarget,
): void {
  const propertyEntries = new Map<StyleProperty, StylePropertyEntry>();
  for (const prop of entries) {
    propertyEntries.set(prop.property, prop);
  }
  const hasPaddingSideEntry = PADDING_SIDE_PROPERTIES.some((property) =>
    propertyEntries.has(property),
  );

  for (const prop of entries) {
    if (
      hasPaddingSideEntry &&
      (prop.property === "padding" ||
        prop.property === "paddingTop" ||
        prop.property === "paddingRight" ||
        prop.property === "paddingBottom" ||
        prop.property === "paddingLeft")
    ) {
      continue;
    }
    addStyleEntry(target, prop.property, prop, breakpoint);
  }

  if (hasPaddingSideEntry) {
    const shorthandEntry = propertyEntries.get("padding");
    for (const property of PADDING_SIDE_PROPERTIES) {
      const entry = propertyEntries.get(property) ?? shorthandEntry;
      if (!entry) {
        continue;
      }
      addStyleEntry(target, property, entry, breakpoint);
    }
  }
}

/**
 * Resolves persisted style bindings to Tailwind utility classes plus inline `var()`
 * styles for token-bound properties. Base entries are unprefixed; breakpoint utility
 * entries use `sm:`/`md:`/`lg:`/`xl:`.
 */
export function resolveStyleBinding(binding: StyleBinding): ResolvedStyle {
  const byBreakpoint = new Map<Breakpoint | "base", StylePropertyEntry[]>();
  for (const entry of binding.properties) {
    const key: Breakpoint | "base" = entry.breakpoint ?? "base";
    const list = byBreakpoint.get(key) ?? [];
    list.push(entry);
    byBreakpoint.set(key, list);
  }

  const target: ResolveTarget = { classes: new Set(), style: {} };
  const baseList = byBreakpoint.get("base");
  if (baseList?.length) {
    resolveStyleEntriesForBreakpoint(baseList, null, target);
  }
  for (const bp of BREAKPOINTS) {
    const list = byBreakpoint.get(bp);
    if (!list?.length) {
      continue;
    }
    resolveStyleEntriesForBreakpoint(list, bp, target);
  }

  return resolvedStyleFromTarget(target);
}

export type ResolveNodeStyleOptions = {
  /**
   * When set, resolve the cascade up to this breakpoint as unprefixed classes (studio
   * canvas preview). Omit for production rendering (prefixed responsive utilities).
   */
  studioPreviewFlattenToBreakpoint?: Breakpoint;
};

/**
 * Resolves style classes and token-bound inline styles for one composition node.
 */
export function resolveNodeStyle(
  node: Pick<CompositionNode, "id" | "styleBindingId">,
  composition: Pick<PageComposition, "styleBindings">,
  options?: ResolveNodeStyleOptions,
): ResolvedNodeStyle {
  if (!node.styleBindingId) {
    return {};
  }
  const binding = composition.styleBindings[node.styleBindingId];
  if (!binding) {
    return {};
  }
  const flattenTo = options?.studioPreviewFlattenToBreakpoint;
  const resolved =
    flattenTo !== undefined
      ? resolveStyleBindingAtBreakpoint(binding, flattenTo)
      : resolveStyleBinding(binding);
  return {
    className: resolved.classes || undefined,
    style: Object.keys(resolved.style).length > 0 ? resolved.style : undefined,
  };
}
