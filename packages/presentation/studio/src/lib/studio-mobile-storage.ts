"use client";

/**
 * Mobile studio persists the last-selected sub-tab inside the Add and Layers
 * sheets. The active sheet itself is not restored — opening one unprompted on
 * reload would hide the canvas.
 */
const STORAGE_PREFIX = "studio.mobile";

export const MOBILE_STORAGE_KEYS = {
  addCatalog: `${STORAGE_PREFIX}.addCatalog`,
  layersTab: `${STORAGE_PREFIX}.layersTab`,
} as const;

export function readMobilePref(key: string): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeMobilePref(key: string, value: string | null): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    if (value === null) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // ignore quota / disabled-storage errors
  }
}
