"use client";

import { useCallback, useSyncExternalStore } from "react";

type ThemeValue = "light" | "dark";

function subscribe(onStoreChange: () => void) {
  const el = document.documentElement;
  const obs = new MutationObserver(onStoreChange);
  obs.observe(el, { attributes: true, attributeFilter: ["data-theme"] });
  return () => obs.disconnect();
}

function getSnapshot(): ThemeValue {
  const raw = document.documentElement.getAttribute("data-theme");
  if (raw === "dark" || raw === "light") {
    return raw;
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getServerSnapshot(): ThemeValue {
  return "light";
}

/** Theme toggle for Studio outside Payload admin (uses `data-theme` on `documentElement`). */
export function useStudioDocumentTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const setTheme = useCallback((value: ThemeValue) => {
    document.documentElement.setAttribute("data-theme", value);
  }, []);
  return { setTheme, theme };
}
