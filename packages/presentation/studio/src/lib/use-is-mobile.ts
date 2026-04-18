"use client";

import { useEffect, useState } from "react";

export const STUDIO_MOBILE_MAX_WIDTH_PX = 1023;

const STUDIO_MOBILE_MEDIA_QUERY = `(max-width: ${STUDIO_MOBILE_MAX_WIDTH_PX}px)`;

function readInitialIsMobile(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return window.matchMedia(STUDIO_MOBILE_MEDIA_QUERY).matches;
}

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(readInitialIsMobile);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const mql = window.matchMedia(STUDIO_MOBILE_MEDIA_QUERY);
    const onChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches);
    };
    setIsMobile(mql.matches);
    mql.addEventListener("change", onChange);
    return () => {
      mql.removeEventListener("change", onChange);
    };
  }, []);

  return isMobile;
}
