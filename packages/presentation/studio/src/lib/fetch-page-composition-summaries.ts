import { PAGE_COMPOSITIONS_SLUG } from "../shell/hub/constants.js";

/** Minimal fields from the page-compositions REST list for Studio navigation. */
export type PageCompositionSummary = {
  id: string | number;
  title: string;
  updatedAt?: string;
  /** Present on versioned / published docs when the API exposes it. */
  publishedAt?: string | null;
  _status?: string | null;
};

export async function fetchPageCompositionSummaries(
  signal?: AbortSignal,
): Promise<PageCompositionSummary[]> {
  const res = await fetch(
    `/api/${PAGE_COMPOSITIONS_SLUG}?limit=200&depth=0&sort=-updatedAt`,
    {
      cache: "no-store",
      credentials: "include",
      headers: { Accept: "application/json" },
      signal,
    },
  );
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const json = (await res.json()) as { docs?: PageCompositionSummary[] };
  return Array.isArray(json.docs) ? json.docs : [];
}
