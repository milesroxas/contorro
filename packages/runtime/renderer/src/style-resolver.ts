import { styleTokenClassName, type TokenMeta } from "@repo/config-tailwind";
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

import {
  utilityClassNameForPropertyValue,
  withBreakpointPrefix,
} from "./composition-style-classes.js";

export type ResolvedStyle = {
  classes: string;
};

export type ResolvedNodeStyle = {
  className?: string;
};

const PADDING_SIDE_PROPERTIES: readonly StyleProperty[] = [
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
];

function addClassForStyleEntry(
  classes: Set<string>,
  property: StyleProperty,
  entry: StylePropertyEntry,
  allowedTokenKeys: ReadonlySet<string>,
  breakpoint: Breakpoint | null,
): void {
  if (entry.type === "token") {
    if (!allowedTokenKeys.has(entry.token)) {
      return;
    }
    classes.add(
      withBreakpointPrefix(
        breakpoint,
        styleTokenClassName(property, entry.token),
      ),
    );
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
    classes.add(withBreakpointPrefix(breakpoint, utilityClassName));
  }
}

/**
 * Emits utility/token classes for one breakpoint group (base when `breakpoint` is null),
 * including padding shorthand vs side merging matching Tailwind class semantics.
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

/**
 * Like {@link resolveStyleBinding}, but resolves the mobile-first cascade up to `upTo`
 * into unprefixed utilities so preview matches the selected breakpoint regardless of
 * actual viewport width.
 */
export function resolveStyleBindingAtBreakpoint(
  binding: StyleBinding,
  tokenMeta: TokenMeta[],
  upTo: Breakpoint,
): ResolvedStyle {
  const merged = mergedEntriesAtBreakpoint(binding, upTo);
  const classes = resolveStyleClassesForBreakpoint(merged, tokenMeta, null);
  return { classes: [...classes].join(" ") };
}

function resolveStyleClassesForBreakpoint(
  entries: StylePropertyEntry[],
  tokenMeta: TokenMeta[],
  breakpoint: Breakpoint | null,
): Set<string> {
  const classes = new Set<string>();
  const allowedTokenKeys = new Set(tokenMeta.map((token) => token.key));
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
    addClassForStyleEntry(
      classes,
      prop.property,
      prop,
      allowedTokenKeys,
      breakpoint,
    );
  }

  if (hasPaddingSideEntry) {
    const shorthandEntry = propertyEntries.get("padding");
    for (const property of PADDING_SIDE_PROPERTIES) {
      const entry = propertyEntries.get(property) ?? shorthandEntry;
      if (!entry) {
        continue;
      }
      addClassForStyleEntry(
        classes,
        property,
        entry,
        allowedTokenKeys,
        breakpoint,
      );
    }
  }

  return classes;
}

/**
 * Resolves persisted style bindings to Tailwind utility and token alias classes.
 * Base entries are unprefixed; breakpoint entries use `sm:`/`md:`/`lg:`/`xl:`.
 */
export function resolveStyleBinding(
  binding: StyleBinding,
  tokenMeta: TokenMeta[],
): ResolvedStyle {
  const byBreakpoint = new Map<Breakpoint | "base", StylePropertyEntry[]>();
  for (const entry of binding.properties) {
    const key: Breakpoint | "base" = entry.breakpoint ?? "base";
    const list = byBreakpoint.get(key) ?? [];
    list.push(entry);
    byBreakpoint.set(key, list);
  }

  const classes = new Set<string>();
  const baseList = byBreakpoint.get("base");
  if (baseList?.length) {
    for (const c of resolveStyleClassesForBreakpoint(
      baseList,
      tokenMeta,
      null,
    )) {
      classes.add(c);
    }
  }
  for (const bp of BREAKPOINTS) {
    const list = byBreakpoint.get(bp);
    if (!list?.length) {
      continue;
    }
    for (const c of resolveStyleClassesForBreakpoint(list, tokenMeta, bp)) {
      classes.add(c);
    }
  }

  return { classes: [...classes].join(" ") };
}

export type ResolveNodeStyleOptions = {
  /**
   * When set, resolve the cascade up to this breakpoint as unprefixed classes (studio
   * canvas preview). Omit for production rendering (prefixed responsive utilities).
   */
  studioPreviewFlattenToBreakpoint?: Breakpoint;
};

/**
 * Resolves style classes for one composition node (utilities only; no inline styles).
 */
export function resolveNodeStyle(
  node: Pick<CompositionNode, "id" | "styleBindingId">,
  composition: Pick<PageComposition, "styleBindings">,
  tokenMeta: TokenMeta[],
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
      ? resolveStyleBindingAtBreakpoint(binding, tokenMeta, flattenTo)
      : resolveStyleBinding(binding, tokenMeta);
  return {
    className: resolved.classes || undefined,
  };
}
