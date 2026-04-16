import { mergeCompiledDesignSystemCss } from "@repo/config-tailwind";
import { useLayoutEffect, useMemo } from "react";

import { runtimeCssVariables } from "./runtime-css-variables.js";

const STYLE_ELEMENT_ID = "studio-design-system-sheet";

export function useStudioDesignSystemStyleSheet(
  cssVariables: string,
  tokenUtilityCss: string,
): void {
  const sheet = useMemo(
    () =>
      mergeCompiledDesignSystemCss({
        cssVariables: runtimeCssVariables(cssVariables),
        tokenUtilityCss,
      }),
    [cssVariables, tokenUtilityCss],
  );

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
