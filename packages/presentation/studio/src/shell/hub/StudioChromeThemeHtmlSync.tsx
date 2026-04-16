"use client";

import { useLayoutEffect } from "react";

import {
  applyStudioChromeThemeToDocument,
  readStoredStudioChromeTheme,
  resolveStudioChromeTheme,
  systemPrefersDarkMediaQuery,
} from "./resolve-studio-chrome-theme.js";

/** Applies `data-theme` on `<html>` from saved choice or `prefers-color-scheme`. */
export function StudioChromeThemeHtmlSync() {
  useLayoutEffect(() => {
    applyStudioChromeThemeToDocument(resolveStudioChromeTheme());

    const media = systemPrefersDarkMediaQuery();
    const syncFromSystem = () => {
      if (readStoredStudioChromeTheme() !== null) {
        return;
      }
      applyStudioChromeThemeToDocument(media.matches ? "dark" : "light");
    };
    media.addEventListener("change", syncFromSystem);
    return () => {
      media.removeEventListener("change", syncFromSystem);
    };
  }, []);

  return null;
}
