/* Sync with packages/presentation/studio/src/shell/hub/resolve-studio-chrome-theme.ts (resolveStudioChromeTheme). */
(() => {
  try {
    const fromStorage =
      localStorage.getItem("studio-theme") ||
      localStorage.getItem("builder-theme");
    if (fromStorage === "light" || fromStorage === "dark") {
      document.documentElement.setAttribute("data-theme", fromStorage);
      document.documentElement.style.colorScheme =
        fromStorage === "dark" ? "dark" : "light";
      return;
    }
    const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.setAttribute(
      "data-theme",
      dark ? "dark" : "light",
    );
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
  } catch {
    /* localStorage unavailable */
  }
})();
