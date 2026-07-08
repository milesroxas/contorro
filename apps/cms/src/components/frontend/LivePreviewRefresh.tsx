"use client";

import { RefreshRouteOnSave } from "@payloadcms/live-preview-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Re-renders the RSC page when the Payload admin live-preview panel reports a
 * change (documented RSC pattern: `RefreshRouteOnSave` + `router.refresh()`).
 * Rendered only in draft mode. The admin and the site share one origin, so the
 * `serverURL` used for postMessage origin checks is the window origin.
 */
export function LivePreviewRefresh() {
  const router = useRouter();
  const [serverURL, setServerURL] = useState<string | null>(null);

  useEffect(() => {
    setServerURL(window.location.origin);
  }, []);

  if (serverURL === null) {
    return null;
  }
  return (
    <RefreshRouteOnSave
      refresh={() => router.refresh()}
      serverURL={serverURL}
    />
  );
}
