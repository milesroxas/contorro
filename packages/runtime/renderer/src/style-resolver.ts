import type { TokenMeta } from "@repo/config-tailwind";
import type { StyleBinding, StyleProperty } from "@repo/contracts-zod";

export type ResolvedStyle = {
  classes: string;
  inlineStyle: Record<string, string>;
};

type StyleRule = {
  className: string;
  cssVariableName: string;
};

const STYLE_RULES: Record<StyleProperty, StyleRule> = {
  background: {
    className: "bg-[var(--builder-style-background)]",
    cssVariableName: "--builder-style-background",
  },
  color: {
    className: "text-[var(--builder-style-color)]",
    cssVariableName: "--builder-style-color",
  },
  padding: {
    className: "p-[var(--builder-style-padding)]",
    cssVariableName: "--builder-style-padding",
  },
  margin: {
    className: "m-[var(--builder-style-margin)]",
    cssVariableName: "--builder-style-margin",
  },
  gap: {
    className: "gap-[var(--builder-style-gap)]",
    cssVariableName: "--builder-style-gap",
  },
  width: {
    className: "w-[var(--builder-style-width)]",
    cssVariableName: "--builder-style-width",
  },
  height: {
    className: "h-[var(--builder-style-height)]",
    cssVariableName: "--builder-style-height",
  },
  minWidth: {
    className: "min-w-[var(--builder-style-min-width)]",
    cssVariableName: "--builder-style-min-width",
  },
  minHeight: {
    className: "min-h-[var(--builder-style-min-height)]",
    cssVariableName: "--builder-style-min-height",
  },
  maxWidth: {
    className: "max-w-[var(--builder-style-max-width)]",
    cssVariableName: "--builder-style-max-width",
  },
  maxHeight: {
    className: "max-h-[var(--builder-style-max-height)]",
    cssVariableName: "--builder-style-max-height",
  },
};

/**
 * Resolves persisted style bindings to class names and/or inline styles (§11.4).
 * Phase 2: prefers inline `var(--token)` for predictable preview without safelists.
 */
export function resolveStyleBinding(
  binding: StyleBinding,
  tokenMeta: TokenMeta[],
): ResolvedStyle {
  const classes = new Set<string>();
  const inlineStyle: Record<string, string> = {};

  for (const prop of binding.properties) {
    if (prop.type === "token") {
      const meta = tokenMeta.find((m) => m.key === prop.token);
      if (!meta) {
        continue;
      }
      const rule = STYLE_RULES[prop.property];
      classes.add(rule.className);
      inlineStyle[rule.cssVariableName] = `var(${meta.cssVar})`;
    }
  }

  return { classes: Array.from(classes).join(" "), inlineStyle };
}
