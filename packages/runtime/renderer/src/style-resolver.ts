import { styleTokenClassName, type TokenMeta } from "@repo/config-tailwind";
import {
  type CompositionNode,
  type PageComposition,
  type StyleBinding,
  type StyleProperty,
  type StylePropertyEntry,
  utilityValuesForStyleProperty,
} from "@repo/contracts-zod";

export type ResolvedStyle = {
  classes: string;
  inlineStyle: Record<string, string>;
};

export type ResolvedNodeStyle = {
  className?: string;
  style?: Record<string, string>;
};

const PADDING_SIDE_PROPERTIES: readonly StyleProperty[] = [
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
];

function utilityClassNameForPropertyValue(
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

function addClassForStyleEntry(
  classes: Set<string>,
  property: StyleProperty,
  entry: StylePropertyEntry,
  allowedTokenKeys: ReadonlySet<string>,
): void {
  if (entry.type === "token") {
    if (!allowedTokenKeys.has(entry.token)) {
      return;
    }
    classes.add(styleTokenClassName(property, entry.token));
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
    classes.add(utilityClassName);
  }
}

/**
 * Resolves persisted style bindings to utility and token alias classes (§11.4).
 */
export function resolveStyleBinding(
  binding: StyleBinding,
  tokenMeta: TokenMeta[],
): ResolvedStyle {
  const classes = new Set<string>();
  const inlineStyle: Record<string, string> = {};
  const allowedTokenKeys = new Set(tokenMeta.map((token) => token.key));
  const propertyEntries = new Map<StyleProperty, StylePropertyEntry>();
  for (const prop of binding.properties) {
    propertyEntries.set(prop.property, prop);
  }
  const hasPaddingSideEntry = PADDING_SIDE_PROPERTIES.some((property) =>
    propertyEntries.has(property),
  );

  for (const prop of binding.properties) {
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
    addClassForStyleEntry(classes, prop.property, prop, allowedTokenKeys);
  }

  if (hasPaddingSideEntry) {
    const shorthandEntry = propertyEntries.get("padding");
    for (const property of PADDING_SIDE_PROPERTIES) {
      const entry = propertyEntries.get(property) ?? shorthandEntry;
      if (!entry) {
        continue;
      }
      addClassForStyleEntry(classes, property, entry, allowedTokenKeys);
    }
  }

  return { classes: Array.from(classes).join(" "), inlineStyle };
}

/**
 * Resolves style classes and inline style for one composition node.
 * Shared by canvas preview and published renderer to avoid drift.
 */
export function resolveNodeStyle(
  node: Pick<CompositionNode, "styleBindingId">,
  composition: Pick<PageComposition, "styleBindings">,
  tokenMeta: TokenMeta[],
): ResolvedNodeStyle {
  if (!node.styleBindingId) {
    return {};
  }
  const binding = composition.styleBindings[node.styleBindingId];
  if (!binding) {
    return {};
  }
  const resolved = resolveStyleBinding(binding, tokenMeta);
  return {
    className: resolved.classes || undefined,
    style:
      Object.keys(resolved.inlineStyle).length > 0
        ? resolved.inlineStyle
        : undefined,
  };
}
