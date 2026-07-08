import type { DesignTokenSet } from "@repo/contracts-zod";

export type TokenMeta = {
  key: string;
  cssVar: string;
  category: string;
};

export type CompileTokenSetOptions = {
  /** Selector that receives base (light) values. Default `:root`. */
  rootSelector?: string;
  /** Selector that receives dark overrides. Default `.dark`. */
  darkSelector?: string;
};

export type CompiledTokenOutput = {
  /**
   * Root + dark variable layers (`:root { … }` / `.dark { … }` by default; scopable via
   * {@link CompileTokenSetOptions}). Variables use the shadcn/theme names consumed by
   * `theme.css`, so published tokens retheme built Tailwind utilities.
   */
  cssVariables: string;
  tokenMetadata: TokenMeta[];
};

/**
 * Maps a design token key to the CSS custom property the site theme consumes
 * (`theme.css` shadcn names):
 *
 * - `color.X…`            → `--X…`            (`color.primary` → `--primary`,
 *                                              `color.card.foreground` → `--card-foreground`)
 * - `radius.base`         → `--radius`
 * - `typography.font.X`   → `--font-X`
 * - anything else         → `--{category}-{rest}` with dots as dashes
 *                                              (`radius.sm` → `--radius-sm`)
 */
export function cssVariableForTokenKey(key: string): string {
  const dashed = key.replace(/\./g, "-");
  if (key.startsWith("color.")) {
    return `--${dashed.slice("color-".length)}`;
  }
  if (key === "radius.base") {
    return "--radius";
  }
  if (key.startsWith("typography.font.")) {
    return `--font-${dashed.slice("typography-font-".length)}`;
  }
  return `--${dashed}`;
}

type TokenModeValues = {
  category: string;
  light?: string;
  dark?: string;
};

/**
 * Compiles persisted tokens into scoped CSS variable blocks plus metadata for the
 * style resolver. No `@theme` block is emitted (browsers ignore it at runtime) and no
 * per-token utility classes — token bindings render as inline `var()` styles.
 */
export function compileTokenSet(
  tokenSet: Pick<DesignTokenSet, "tokens">,
  options?: CompileTokenSetOptions,
): CompiledTokenOutput {
  const rootSelector = options?.rootSelector ?? ":root";
  const darkSelector = options?.darkSelector ?? ".dark";

  const byKey = new Map<string, TokenModeValues>();
  for (const token of tokenSet.tokens) {
    const entry = byKey.get(token.key) ?? { category: token.category };
    if (token.mode === "dark") {
      entry.dark = token.resolvedValue;
    } else {
      entry.light = token.resolvedValue;
    }
    byKey.set(token.key, entry);
  }

  const rootLines: string[] = [];
  const darkLines: string[] = [];
  const meta: TokenMeta[] = [];
  for (const [key, entry] of byKey) {
    const cssVar = cssVariableForTokenKey(key);
    // Dark-only tokens emit their dark value as the base so light mode is never unset.
    const baseValue = entry.light ?? entry.dark;
    if (baseValue !== undefined) {
      rootLines.push(`  ${cssVar}: ${baseValue};`);
    }
    if (entry.dark !== undefined) {
      darkLines.push(`  ${cssVar}: ${entry.dark};`);
    }
    meta.push({ key, cssVar, category: entry.category });
  }

  const blocks: string[] = [];
  if (rootLines.length > 0) {
    blocks.push(`${rootSelector} {\n${rootLines.join("\n")}\n}`);
  }
  if (darkLines.length > 0) {
    blocks.push(`${darkSelector} {\n${darkLines.join("\n")}\n}`);
  }

  return {
    cssVariables: blocks.join("\n\n"),
    tokenMetadata: meta,
  };
}
