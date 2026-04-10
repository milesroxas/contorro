import type { TokenMeta } from "@repo/config-tailwind";
import { tokenKeyToCssVar } from "@repo/config-tailwind";
import type { StyleBinding } from "@repo/contracts-zod";

export type ResolvedStyle = {
  classes: string;
  inlineStyle: Record<string, string>;
};

function cssPropName(property: string): string {
  const map: Record<string, string> = {
    background: "backgroundColor",
    backgroundColor: "backgroundColor",
    color: "color",
    padding: "padding",
    margin: "margin",
    gap: "gap",
  };
  return map[property] ?? property;
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
    } else if (prop.type === "override") {
      const v = prop.value;
      const cssName = cssPropName(prop.property);
      if (
        typeof v === "object" &&
        v !== null &&
        "hex" in v &&
        typeof (v as { hex: string }).hex === "string"
      ) {
        const alpha = (v as { alpha?: number }).alpha;
        const hex = (v as { hex: string }).hex;
        inlineStyle[cssName] =
          alpha !== undefined
            ? `color-mix(in srgb, ${hex} ${alpha * 100}%, transparent)`
            : hex;
      } else if (
        typeof v === "object" &&
        v !== null &&
        "value" in v &&
        "unit" in v
      ) {
        const o = v as { value: number; unit: string };
        inlineStyle[cssName] = `${o.value}${o.unit}`;
      } else if (typeof v === "string" || typeof v === "number") {
        inlineStyle[cssName] = String(v);
      }
    }
  }

  return { classes: classes.join(" "), inlineStyle };
}
