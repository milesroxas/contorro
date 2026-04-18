import {
  BREAKPOINT_MIN_WIDTH_PX,
  BREAKPOINTS,
  type StyleProperty,
} from "@repo/contracts-zod";
import type { DesignToken, DesignTokenSet } from "@repo/domains-design-system";

export type TokenMeta = {
  key: string;
  cssVar: string;
  category: string;
};

export type CompiledTokenOutput = {
  /**
   * Theme + root variable layers only (`@theme`, `:root`, `.dark`) — same conceptual
   * role as `theme.css` / `globals.css` token wiring.
   */
  cssVariables: string;
  /**
   * Explicit `.bg-*` / `.text-*` / … rules mapping utilities to `var(--token)`.
   * Tailwind’s JIT cannot see classes that only appear in CMS-backed composition data,
   * so these rules are emitted explicitly (not “inline styles” on nodes).
   */
  tokenUtilityCss: string;
  tokenMetadata: TokenMeta[];
};

export type StudioStyleProperty = StyleProperty;

const TOKEN_UTILITY_CLASS_PREFIX: Record<StudioStyleProperty, string> = {
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
  overflow: "overflow",
  overflowX: "overflow-x",
  overflowY: "overflow-y",
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

const TOKEN_CSS_PROPERTIES: Record<StudioStyleProperty, string> = {
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
  overflow: "overflow",
  overflowX: "overflow-x",
  overflowY: "overflow-y",
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

/** Escapes `:` for Tailwind-style responsive class selectors (`sm:text-…`). */
function escapeClassSelector(className: string): string {
  return className.replace(/\\/g, "\\\\").replace(/:/g, "\\:");
}

export function styleTokenClassName(
  property: StudioStyleProperty,
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

  const variableBlocks: string[] = [`@theme {\n${themeLines.join("\n")}\n}`];
  if (lightLines.length > 0) {
    variableBlocks.push(`:root {\n${lightLines.join("\n")}\n}`);
  }
  if (darkLines.length > 0) {
    variableBlocks.push(`.dark {\n${darkLines.join("\n")}\n}`);
  }

  const studioTokenClassLines: string[] = [];
  for (const token of meta) {
    for (const [property, cssProperty] of Object.entries(
      TOKEN_CSS_PROPERTIES,
    ) as [StudioStyleProperty, string][]) {
      const baseClass = styleTokenClassName(property, token.key);
      const rule = `${cssProperty}: var(${token.cssVar});`;
      studioTokenClassLines.push(
        `.${escapeClassSelector(baseClass)} { ${rule} }`,
      );
      for (const bp of BREAKPOINTS) {
        const prefixed = `${bp}:${baseClass}`;
        studioTokenClassLines.push(
          `@media (min-width: ${BREAKPOINT_MIN_WIDTH_PX[bp]}px) { .${escapeClassSelector(prefixed)} { ${rule} } }`,
        );
      }
    }
  }

  const cssVariables = variableBlocks.join("\n\n");
  const tokenUtilityCss =
    studioTokenClassLines.length > 0 ? studioTokenClassLines.join("\n") : "";

  return {
    cssVariables,
    tokenUtilityCss,
    tokenMetadata: meta,
  };
}

/** Full stylesheet for pages that inject both layers in a single `<style>` tag. */
export function mergeCompiledDesignSystemCss(
  compiled: Pick<CompiledTokenOutput, "cssVariables" | "tokenUtilityCss">,
): string {
  return [compiled.cssVariables, compiled.tokenUtilityCss]
    .map((s) => s.trim())
    .filter(Boolean)
    .join("\n\n");
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
