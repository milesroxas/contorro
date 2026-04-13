import type { TokenMeta } from "@repo/config-tailwind";
import { tokenKeyToCssVar } from "@repo/config-tailwind";
import type { StyleBinding, StyleProperty } from "@repo/contracts-zod";

export type ResolvedStyle = {
  classes: string;
  inlineStyle: Record<string, string>;
};

function cssPropName(property: StyleProperty): string {
  const map: Record<StyleProperty, string> = {
    background: "backgroundColor",
    color: "color",
    padding: "padding",
    margin: "margin",
    gap: "gap",
    width: "width",
    height: "height",
    minWidth: "minWidth",
    minHeight: "minHeight",
    maxWidth: "maxWidth",
    maxHeight: "maxHeight",
  };
  return map[property];
}

/**
 * Resolves persisted style bindings to class names and/or inline styles (§11.4).
 * Phase 2: prefers inline `var(--token)` for predictable preview without safelists.
 */
export function resolveStyleBinding(
  binding: StyleBinding,
  tokenMeta: TokenMeta[],
): ResolvedStyle {
  const classes: string[] = [];
  const inlineStyle: Record<string, string> = {};

  for (const prop of binding.properties) {
    if (prop.type === "token") {
      const meta = tokenMeta.find((m) => m.key === prop.token);
      const cssName = cssPropName(prop.property);
      if (meta) {
        inlineStyle[cssName] = `var(${meta.cssVar})`;
      } else {
        inlineStyle[cssName] = `var(${tokenKeyToCssVar(prop.token)})`;
      }
    }
  }

  return { classes: classes.join(" "), inlineStyle };
}
