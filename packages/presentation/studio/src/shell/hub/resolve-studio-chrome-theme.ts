export type StudioChromeTheme = "light" | "dark";

const STORAGE_KEYS = ["studio-theme", "builder-theme"] as const;

export function readStoredStudioChromeTheme(): StudioChromeTheme | null {
  if (typeof window === "undefined") {
    return null;
  }
  for (const key of STORAGE_KEYS) {
    const raw = window.localStorage.getItem(key);
    if (raw === "light" || raw === "dark") {
      return raw;
    }
  }
  return null;
}

function systemPrefersDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/**
 * Stored preference, else OS light/dark (no storage write).
 * Keep in sync with `apps/cms/public/studio-document-theme-bootstrap.js` (early `<head>` script).
 */
export function resolveStudioChromeTheme(): StudioChromeTheme {
  const stored = readStoredStudioChromeTheme();
  if (stored !== null) {
    return stored;
  }
  return systemPrefersDark() ? "dark" : "light";
}

export function applyStudioChromeThemeToDocument(
  theme: StudioChromeTheme,
): void {
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme =
    theme === "dark" ? "dark" : "light";
}

export function persistStudioChromeTheme(theme: StudioChromeTheme): void {
  window.localStorage.setItem("studio-theme", theme);
  applyStudioChromeThemeToDocument(theme);
}

export function systemPrefersDarkMediaQuery(): MediaQueryList {
  return window.matchMedia("(prefers-color-scheme: dark)");
}
