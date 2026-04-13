import {
  type BuilderStyleProperty,
  type TokenMeta,
  styleTokenClassName,
} from "@repo/config-tailwind";
import {
  type StyleBinding,
  type StyleProperty,
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

const STYLE_RULES: Record<StyleProperty, StyleRule> = {
  background: {
    property: "background",
    tokenClassName: "bg-[var(--builder-style-background)]",
  },
  color: {
    property: "color",
    tokenClassName: "text-[var(--builder-style-color)]",
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

function spacingValueToCss(value: string): string | null {
  if (value === "px") {
    return "1px";
  }
  if (/^\d+(\.\d+)?$/.test(value)) {
    return `calc(var(--spacing) * ${value})`;
  }
  return null;
}

function fractionValueToCss(value: string): string | null {
  if (!/^\d+\/\d+$/.test(value)) {
    return null;
  }
  const [n, d] = value.split("/");
  const numerator = Number.parseInt(n, 10);
  const denominator = Number.parseInt(d, 10);
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
    return null;
  }
  return `${(numerator / denominator) * 100}%`;
}

function sizeValueToCss(
  value: string,
  axis: "width" | "height",
): string | null {
  const spacing = spacingValueToCss(value);
  if (spacing) {
    return spacing;
  }
  const fraction = fractionValueToCss(value);
  if (fraction) {
    return fraction;
  }
  if (value === "auto") {
    return "auto";
  }
  if (value === "full") {
    return "100%";
  }
  if (value === "screen") {
    return axis === "width" ? "100vw" : "100vh";
  }
  if (value === "min") {
    return "min-content";
  }
  if (value === "max") {
    return "max-content";
  }
  if (value === "fit") {
    return "fit-content";
  }
  if (/^(3xs|2xs|xs|sm|md|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl)$/.test(value)) {
    return `var(--container-${value})`;
  }
  if (value === "prose") {
    return "var(--container-prose)";
  }
  if (/^screen-(sm|md|lg|xl|2xl)$/.test(value)) {
    const bp = value.replace("screen-", "");
    return `var(--breakpoint-${bp})`;
  }
  if (value === "none") {
    return "none";
  }
  return null;
}

function utilityClassNameForPropertyValue(
  property: StyleProperty,
  value: string,
): string | null {
  if (property === "width" && value === "container") {
    return "container";
  }
  return null;
}

function utilityInlineStyleForPropertyValue(
  property: StyleProperty,
  value: string,
): { key: string; value: string } | null {
  const spacing = spacingValueToCss(value);
  switch (property) {
    case "display":
      return {
        key: "display",
        value: value === "hidden" ? "none" : value,
      };
    case "flexDirection":
      return {
        key: "flexDirection",
        value:
          value === "col"
            ? "column"
            : value === "col-reverse"
              ? "column-reverse"
              : value,
      };
    case "flexWrap":
      return { key: "flexWrap", value };
    case "justifyContent":
      return {
        key: "justifyContent",
        value:
          value === "start"
            ? "flex-start"
            : value === "end"
              ? "flex-end"
              : value === "between"
                ? "space-between"
                : value === "around"
                  ? "space-around"
                  : value === "evenly"
                    ? "space-evenly"
                    : value,
      };
    case "alignItems":
    case "alignSelf":
      return {
        key: property,
        value:
          value === "start"
            ? "flex-start"
            : value === "end"
              ? "flex-end"
              : value,
      };
    case "flex":
      return { key: "flex", value };
    case "flexGrow":
      return { key: "flexGrow", value: value === "0" ? "0" : "1" };
    case "flexShrink":
      return { key: "flexShrink", value: value === "0" ? "0" : "1" };
    case "flexBasis": {
      const cssValue = sizeValueToCss(value, "width");
      return cssValue ? { key: "flexBasis", value: cssValue } : null;
    }
    case "order":
      return {
        key: "order",
        value:
          value === "first"
            ? "-9999"
            : value === "last"
              ? "9999"
              : value === "none"
                ? "0"
                : value,
      };
    case "padding":
    case "paddingTop":
    case "paddingRight":
    case "paddingBottom":
    case "paddingLeft":
    case "gap":
      return spacing ? { key: property, value: spacing } : null;
    case "margin":
    case "marginTop":
    case "marginRight":
    case "marginBottom":
    case "marginLeft":
      return value === "auto"
        ? { key: property, value: "auto" }
        : spacing
          ? { key: property, value: spacing }
          : null;
    case "width":
    case "minWidth":
    case "maxWidth": {
      const cssValue = sizeValueToCss(value, "width");
      return cssValue ? { key: property, value: cssValue } : null;
    }
    case "height":
    case "minHeight":
    case "maxHeight": {
      const cssValue = sizeValueToCss(value, "height");
      return cssValue ? { key: property, value: cssValue } : null;
    }
    default:
      return null;
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

  for (const prop of binding.properties) {
    const rule = STYLE_RULES[prop.property];
    if (prop.type === "token") {
      if (!allowedTokenKeys.has(prop.token) || !rule.tokenClassName) {
        continue;
      }
      classes.add(rule.tokenClassName);
      classes.add(styleTokenClassName(rule.property, prop.token));
      continue;
    }
    if (!utilityValuesForStyleProperty(prop.property).includes(prop.value)) {
      continue;
    }
    const utilityClassName = utilityClassNameForPropertyValue(
      prop.property,
      prop.value,
    );
    if (utilityClassName) {
      classes.add(utilityClassName);
      continue;
    }
    const inlineDeclaration = utilityInlineStyleForPropertyValue(
      prop.property,
      prop.value,
    );
    if (inlineDeclaration) {
      inlineStyle[inlineDeclaration.key] = inlineDeclaration.value;
    }
  }

  return { classes: Array.from(classes).join(" "), inlineStyle };
}
