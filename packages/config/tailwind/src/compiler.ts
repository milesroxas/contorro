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
  | "borderColor"
  | "borderRadius"
  | "borderStyle"
  | "borderWidth"
  | "color"
  | "fontFamily"
  | "fontSize"
  | "fontWeight"
  | "textAlign"
  | "lineHeight"
  | "letterSpacing"
  | "textTransform"
  | "fontStyle"
  | "textDecorationLine"
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
  | "aspectRatio"
  | "minWidth"
  | "minHeight"
  | "maxWidth"
  | "maxHeight";

const TOKEN_UTILITY_CLASS_PREFIX: Record<BuilderStyleProperty, string> = {
  background: "bg",
  borderColor: "border-color",
  borderRadius: "rounded",
  borderStyle: "border-style",
  borderWidth: "border-width",
  color: "text",
  fontFamily: "font",
  fontSize: "text-size",
  fontWeight: "font-weight",
  textAlign: "text-align",
  lineHeight: "leading",
  letterSpacing: "tracking",
  textTransform: "text-transform",
  fontStyle: "font-style",
  textDecorationLine: "decoration",
  display: "display",
  flexDirection: "flex-direction",
  flexWrap: "flex-wrap",
  justifyContent: "justify",
  alignItems: "items",
  alignSelf: "self",
  flex: "flex",
  flexGrow: "grow",
  flexShrink: "shrink",
  flexBasis: "basis",
  order: "order",
  padding: "p",
  paddingTop: "pt",
  paddingRight: "pr",
  paddingBottom: "pb",
  paddingLeft: "pl",
  margin: "m",
  marginTop: "mt",
  marginRight: "mr",
  marginBottom: "mb",
  marginLeft: "ml",
  gap: "gap",
  width: "w",
  height: "h",
  aspectRatio: "aspect",
  minWidth: "min-w",
  minHeight: "min-h",
  maxWidth: "max-w",
  maxHeight: "max-h",
};

const TOKEN_CSS_PROPERTIES: Record<BuilderStyleProperty, string> = {
  background: "background-color",
  borderColor: "border-color",
  borderRadius: "border-radius",
  borderStyle: "border-style",
  borderWidth: "border-width",
  color: "color",
  fontFamily: "font-family",
  fontSize: "font-size",
  fontWeight: "font-weight",
  textAlign: "text-align",
  lineHeight: "line-height",
  letterSpacing: "letter-spacing",
  textTransform: "text-transform",
  fontStyle: "font-style",
  textDecorationLine: "text-decoration-line",
  display: "display",
  flexDirection: "flex-direction",
  flexWrap: "flex-wrap",
  justifyContent: "justify-content",
  alignItems: "align-items",
  alignSelf: "align-self",
  flex: "flex",
  flexGrow: "flex-grow",
  flexShrink: "flex-shrink",
  flexBasis: "flex-basis",
  order: "order",
  padding: "padding",
  paddingTop: "padding-top",
  paddingRight: "padding-right",
  paddingBottom: "padding-bottom",
  paddingLeft: "padding-left",
  margin: "margin",
  marginTop: "margin-top",
  marginRight: "margin-right",
  marginBottom: "margin-bottom",
  marginLeft: "margin-left",
  gap: "gap",
  width: "width",
  height: "height",
  aspectRatio: "aspect-ratio",
  minWidth: "min-width",
  minHeight: "min-height",
  maxWidth: "max-width",
  maxHeight: "max-height",
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
  return `${TOKEN_UTILITY_CLASS_PREFIX[property]}-${tokenKeyToClassSegment(tokenKey)}`;
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
    for (const [property, cssProperty] of Object.entries(
      TOKEN_CSS_PROPERTIES,
    ) as [BuilderStyleProperty, string][]) {
      builderTokenClassLines.push(
        `.${styleTokenClassName(property, token.key)} { ${cssProperty}: var(${token.cssVar}); }`,
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
