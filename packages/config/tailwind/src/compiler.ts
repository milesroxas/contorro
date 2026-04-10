import type { DesignToken, DesignTokenSet } from "@repo/domains-design-system";

export type TokenMeta = {
  key: string;
  cssVar: string;
  category: string;
};

export type CompiledTokenOutput = {
  /** Tailwind v4 `@theme` block with CSS variables. */
  cssVariables: string;
  tokenMetadata: TokenMeta[];
};

/** Maps a design token key to a CSS custom property name (spec §11.3). */
export function tokenKeyToCssVar(key: string): string {
  return `--${key.replace(/\./g, "-")}`;
}

/**
 * Compiles persisted tokens into `@theme` output and metadata for the style resolver.
 * See architecture spec §11.3.
 */
export function compileTokenSet(
  tokenSet: Pick<DesignTokenSet, "tokens">,
): CompiledTokenOutput {
  const cssLines: string[] = [];
  const meta: TokenMeta[] = [];

  for (const token of tokenSet.tokens) {
    appendTokenLines(token, cssLines, meta);
  }

  return {
    cssVariables: `@theme {\n${cssLines.join("\n")}\n}`,
    tokenMetadata: meta,
  };
}

function appendTokenLines(
  token: DesignToken,
  cssLines: string[],
  meta: TokenMeta[],
): void {
  const varName = tokenKeyToCssVar(token.key);
  cssLines.push(`  ${varName}: ${token.resolvedValue};`);
  meta.push({ key: token.key, cssVar: varName, category: token.category });
}
