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

export type BuilderStyleProperty =
  | "background"
  | "color"
  | "display"
  | "flexDirection"
  | "flexWrap"
  | "justifyContent"
  | "alignItems"
  | "alignSelf"
  | "flex"
  | "flexGrow"
  | "flexShrink"
  | "flexBasis"
  | "order"
  | "padding"
  | "paddingTop"
  | "paddingRight"
  | "paddingBottom"
  | "paddingLeft"
  | "margin"
  | "marginTop"
  | "marginRight"
  | "marginBottom"
  | "marginLeft"
  | "gap"
  | "width"
  | "height"
  | "minWidth"
  | "minHeight"
  | "maxWidth"
  | "maxHeight";

const BUILDER_STYLE_VARIABLES: Record<BuilderStyleProperty, string> = {
  background: "--builder-style-background",
  color: "--builder-style-color",
  display: "--builder-style-display",
  flexDirection: "--builder-style-flex-direction",
  flexWrap: "--builder-style-flex-wrap",
  justifyContent: "--builder-style-justify-content",
  alignItems: "--builder-style-align-items",
  alignSelf: "--builder-style-align-self",
  flex: "--builder-style-flex",
  flexGrow: "--builder-style-flex-grow",
  flexShrink: "--builder-style-flex-shrink",
  flexBasis: "--builder-style-flex-basis",
  order: "--builder-style-order",
  padding: "--builder-style-padding",
  paddingTop: "--builder-style-padding-top",
  paddingRight: "--builder-style-padding-right",
  paddingBottom: "--builder-style-padding-bottom",
  paddingLeft: "--builder-style-padding-left",
  margin: "--builder-style-margin",
  marginTop: "--builder-style-margin-top",
  marginRight: "--builder-style-margin-right",
  marginBottom: "--builder-style-margin-bottom",
  marginLeft: "--builder-style-margin-left",
  gap: "--builder-style-gap",
  width: "--builder-style-width",
  height: "--builder-style-height",
  minWidth: "--builder-style-min-width",
  minHeight: "--builder-style-min-height",
  maxWidth: "--builder-style-max-width",
  maxHeight: "--builder-style-max-height",
};

/** Maps a design token key to a CSS custom property name (spec §11.3). */
export function tokenKeyToCssVar(key: string): string {
  return `--${key.replace(/\./g, "-")}`;
}

function tokenKeyToClassSegment(key: string): string {
  return key.replace(/[^a-zA-Z0-9_-]/g, "-");
}

export function styleTokenClassName(
  property: BuilderStyleProperty,
  tokenKey: string,
): string {
  return `builder-style-token-${property}-${tokenKeyToClassSegment(tokenKey)}`;
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

  const builderTokenClassLines: string[] = [];
  for (const token of meta) {
    for (const [property, cssVariableName] of Object.entries(
      BUILDER_STYLE_VARIABLES,
    ) as [BuilderStyleProperty, string][]) {
      builderTokenClassLines.push(
        `.${styleTokenClassName(property, token.key)} { ${cssVariableName}: var(${token.cssVar}); }`,
      );
    }
  }
  if (builderTokenClassLines.length > 0) {
    blocks.push(builderTokenClassLines.join("\n"));
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
