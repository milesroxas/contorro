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
  const themeLines: string[] = [];
  const lightLines: string[] = [];
  const darkLines: string[] = [];
  const meta: TokenMeta[] = [];
  const seenKeys = new Set<string>();

  for (const token of tokenSet.tokens) {
    appendTokenLines(token, themeLines, lightLines, darkLines, meta, seenKeys);
  }

  const blocks = [`@theme {\n${themeLines.join("\n")}\n}`];
  if (lightLines.length > 0) {
    blocks.push(`:root {\n${lightLines.join("\n")}\n}`);
  }
  if (darkLines.length > 0) {
    blocks.push(`.dark {\n${darkLines.join("\n")}\n}`);
  }

  return {
    cssVariables: blocks.join("\n\n"),
    tokenMetadata: meta,
  };
}

function appendTokenLines(
  token: DesignToken,
  themeLines: string[],
  lightLines: string[],
  darkLines: string[],
  meta: TokenMeta[],
  seenKeys: Set<string>,
): void {
  const baseVarName = tokenKeyToCssVar(token.key);
  const mode = token.mode === "dark" ? "dark" : "light";
  const modeVarName = `${baseVarName}--${mode}`;

  if (!seenKeys.has(token.key)) {
    themeLines.push(
      `  ${baseVarName}: var(${baseVarName}--light, var(${baseVarName}--dark));`,
    );
    lightLines.push(
      `  ${baseVarName}: var(${baseVarName}--light, var(${baseVarName}--dark));`,
    );
    darkLines.push(
      `  ${baseVarName}: var(${baseVarName}--dark, var(${baseVarName}--light));`,
    );
    meta.push({
      key: token.key,
      cssVar: baseVarName,
      category: token.category,
    });
    seenKeys.add(token.key);
  }

  if (mode === "dark") {
    darkLines.push(`  ${modeVarName}: ${token.resolvedValue};`);
    return;
  }
  lightLines.push(`  ${modeVarName}: ${token.resolvedValue};`);
}
