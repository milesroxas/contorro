import {
  type BuilderStyleProperty,
  type TokenMeta,
  styleTokenClassName,
} from "@repo/config-tailwind";
import {
  type StyleBinding,
  type StyleProperty,
  type StylePropertyEntry,
  utilityValuesForStyleProperty,
} from "@repo/contracts-zod";

export type ResolvedStyle = {
  classes: string;
  inlineStyle: Record<string, string>;
};

type StyleRule = {
  property: BuilderStyleProperty;
  tokenClassName?: string;
};

const PADDING_SIDE_PROPERTIES: readonly StyleProperty[] = [
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
];

const STYLE_RULES: Record<StyleProperty, StyleRule> = {
  background: {
    property: "background",
    tokenClassName: "bg-[var(--builder-style-background)]",
  },
  borderColor: {
    property: "borderColor",
    tokenClassName: "border-[var(--builder-style-border-color)]",
  },
  borderRadius: {
    property: "borderRadius",
    tokenClassName: "rounded-[var(--builder-style-border-radius)]",
  },
  borderStyle: {
    property: "borderStyle",
    tokenClassName: "[border-style:var(--builder-style-border-style)]",
  },
  borderWidth: {
    property: "borderWidth",
    tokenClassName: "border-[var(--builder-style-border-width)]",
  },
  color: {
    property: "color",
    tokenClassName: "text-[var(--builder-style-color)]",
  },
  fontFamily: {
    property: "fontFamily",
    tokenClassName: "[font-family:var(--builder-style-font-family)]",
  },
  fontSize: {
    property: "fontSize",
    tokenClassName: "[font-size:var(--builder-style-font-size)]",
  },
  fontWeight: {
    property: "fontWeight",
    tokenClassName: "[font-weight:var(--builder-style-font-weight)]",
  },
  textAlign: {
    property: "textAlign",
    tokenClassName: "[text-align:var(--builder-style-text-align)]",
  },
  lineHeight: {
    property: "lineHeight",
    tokenClassName: "[line-height:var(--builder-style-line-height)]",
  },
  letterSpacing: {
    property: "letterSpacing",
    tokenClassName: "[letter-spacing:var(--builder-style-letter-spacing)]",
  },
  textTransform: {
    property: "textTransform",
    tokenClassName: "[text-transform:var(--builder-style-text-transform)]",
  },
  fontStyle: {
    property: "fontStyle",
    tokenClassName: "[font-style:var(--builder-style-font-style)]",
  },
  textDecorationLine: {
    property: "textDecorationLine",
    tokenClassName:
      "[text-decoration-line:var(--builder-style-text-decoration-line)]",
  },
  display: {
    property: "display",
    tokenClassName: "[display:var(--builder-style-display)]",
  },
  flexDirection: {
    property: "flexDirection",
    tokenClassName: "[flex-direction:var(--builder-style-flex-direction)]",
  },
  flexWrap: {
    property: "flexWrap",
    tokenClassName: "[flex-wrap:var(--builder-style-flex-wrap)]",
  },
  justifyContent: {
    property: "justifyContent",
    tokenClassName: "[justify-content:var(--builder-style-justify-content)]",
  },
  alignItems: {
    property: "alignItems",
    tokenClassName: "[align-items:var(--builder-style-align-items)]",
  },
  alignSelf: {
    property: "alignSelf",
    tokenClassName: "[align-self:var(--builder-style-align-self)]",
  },
  flex: {
    property: "flex",
    tokenClassName: "[flex:var(--builder-style-flex)]",
  },
  flexGrow: {
    property: "flexGrow",
    tokenClassName: "[flex-grow:var(--builder-style-flex-grow)]",
  },
  flexShrink: {
    property: "flexShrink",
    tokenClassName: "[flex-shrink:var(--builder-style-flex-shrink)]",
  },
  flexBasis: {
    property: "flexBasis",
    tokenClassName: "[flex-basis:var(--builder-style-flex-basis)]",
  },
  order: {
    property: "order",
    tokenClassName: "[order:var(--builder-style-order)]",
  },
  padding: {
    property: "padding",
    tokenClassName: "p-[var(--builder-style-padding)]",
  },
  paddingTop: {
    property: "paddingTop",
    tokenClassName: "pt-[var(--builder-style-padding-top)]",
  },
  paddingRight: {
    property: "paddingRight",
    tokenClassName: "pr-[var(--builder-style-padding-right)]",
  },
  paddingBottom: {
    property: "paddingBottom",
    tokenClassName: "pb-[var(--builder-style-padding-bottom)]",
  },
  paddingLeft: {
    property: "paddingLeft",
    tokenClassName: "pl-[var(--builder-style-padding-left)]",
  },
  margin: {
    property: "margin",
    tokenClassName: "m-[var(--builder-style-margin)]",
  },
  marginTop: {
    property: "marginTop",
    tokenClassName: "mt-[var(--builder-style-margin-top)]",
  },
  marginRight: {
    property: "marginRight",
    tokenClassName: "mr-[var(--builder-style-margin-right)]",
  },
  marginBottom: {
    property: "marginBottom",
    tokenClassName: "mb-[var(--builder-style-margin-bottom)]",
  },
  marginLeft: {
    property: "marginLeft",
    tokenClassName: "ml-[var(--builder-style-margin-left)]",
  },
  gap: {
    property: "gap",
    tokenClassName: "gap-[var(--builder-style-gap)]",
  },
  width: {
    property: "width",
    tokenClassName: "w-[var(--builder-style-width)]",
  },
  height: {
    property: "height",
    tokenClassName: "h-[var(--builder-style-height)]",
  },
  aspectRatio: {
    property: "aspectRatio",
    tokenClassName: "aspect-[var(--builder-style-aspect-ratio)]",
  },
  minWidth: {
    property: "minWidth",
    tokenClassName: "min-w-[var(--builder-style-min-width)]",
  },
  minHeight: {
    property: "minHeight",
    tokenClassName: "min-h-[var(--builder-style-min-height)]",
  },
  maxWidth: {
    property: "maxWidth",
    tokenClassName: "max-w-[var(--builder-style-max-width)]",
  },
  maxHeight: {
    property: "maxHeight",
    tokenClassName: "max-h-[var(--builder-style-max-height)]",
  },
};

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
    classes.add(
      styleTokenClassName(STYLE_RULES[property].property, entry.token),
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
