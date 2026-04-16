/**
 * Map design-system variable layers onto `[data-studio-theme]` (see `StudioRoot`)
 * so tokens behave like scoped `:root` / `.dark` in `globals.css`, without polluting
 * the document `:root`.
 */
export function runtimeCssVariables(cssVariables: string): string {
  const trimmed = cssVariables.trim();
  if (trimmed.length === 0) {
    return "";
  }
  const withRuntimeTheme = trimmed.replace(
    /@theme\s*\{([\s\S]*?)\}/g,
    (_match, body) => `[data-studio-theme] {${body}\n}`,
  );
  const withRoot = withRuntimeTheme.replace(
    /(^|\n)\s*:root\s*\{/g,
    "$1[data-studio-theme] {",
  );
  return withRoot.replace(
    /(^|\n)\s*\.dark\s*\{/g,
    '$1[data-studio-theme="dark"] {',
  );
}
