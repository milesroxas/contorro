import { useLayoutEffect } from "react";

const STYLE_ELEMENT_ID = "studio-design-system-sheet";

/**
 * Injects the design-system token variables for the canvas. The API delivers them
 * pre-scoped to `[data-studio-canvas-mode]` (see `STUDIO_CANVAS_MODE_ATTRIBUTE`), so
 * the sheet is used verbatim and only affects the canvas subtree.
 */
export function useStudioDesignSystemStyleSheet(cssVariables: string): void {
  const sheet = cssVariables.trim();

  useLayoutEffect(() => {
    if (!sheet) {
      document.getElementById(STYLE_ELEMENT_ID)?.remove();
      return;
    }
    let el = document.getElementById(
      STYLE_ELEMENT_ID,
    ) as HTMLStyleElement | null;
    if (!el) {
      el = document.createElement("style");
      el.id = STYLE_ELEMENT_ID;
      document.head.appendChild(el);
    }
    el.textContent = sheet;
    return () => {
      el?.remove();
    };
  }, [sheet]);
}
