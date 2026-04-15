"use client";

import type { CompositionNode } from "@repo/contracts-zod";
import { useEffect, useState } from "react";

type ListItem = {
  key: string;
  displayName: string;
  studioCompositionId: string;
};

type LibraryComponentIndexCache = {
  labels: Record<string, string>;
  editStudioHrefByKey: Record<string, string>;
};

let cache: LibraryComponentIndexCache | null = null;
let inflight: Promise<LibraryComponentIndexCache> | null = null;

function studioRelativeFetchUrl(path: string): string {
  const base =
    typeof window !== "undefined" && window.location?.href
      ? window.location.href
      : "http://localhost/";
  return new URL(path, base).href;
}

async function loadLibraryComponentIndex(): Promise<LibraryComponentIndexCache> {
  const res = await fetch(
    studioRelativeFetchUrl("/api/studio/library-components"),
    {
      credentials: "include",
    },
  );
  if (!res.ok) {
    return { editStudioHrefByKey: {}, labels: {} };
  }
  const json = (await res.json()) as { data?: { items?: ListItem[] } };
  const items = json.data?.items ?? [];
  const labels: Record<string, string> = {};
  const editStudioHrefByKey: Record<string, string> = {};
  for (const it of items) {
    const k = typeof it.key === "string" ? it.key.trim() : "";
    if (k === "") {
      continue;
    }
    const label =
      typeof it.displayName === "string" && it.displayName.trim() !== ""
        ? it.displayName.trim()
        : k;
    labels[k] = label;
    const studioCompositionId =
      typeof it.studioCompositionId === "string"
        ? it.studioCompositionId.trim()
        : "";
    if (studioCompositionId !== "") {
      editStudioHrefByKey[k] =
        `/studio?composition=${encodeURIComponent(studioCompositionId)}`;
    }
  }
  return { editStudioHrefByKey, labels };
}

export function useLibraryComponentIndex(): LibraryComponentIndexCache {
  const [state, setState] = useState<LibraryComponentIndexCache>(() => ({
    editStudioHrefByKey: cache?.editStudioHrefByKey ?? {},
    labels: cache?.labels ?? {},
  }));
  useEffect(() => {
    if (cache) {
      setState(cache);
      return;
    }
    if (!inflight) {
      inflight = loadLibraryComponentIndex().then((m) => {
        cache = m;
        return m;
      });
    }
    let cancelled = false;
    void inflight.then((m) => {
      if (!cancelled) {
        setState(m);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return state;
}

/**
 * Published library component keys → display labels (shared with the Components palette).
 */
export function useLibraryComponentLabels(): Record<string, string> {
  return useLibraryComponentIndex().labels;
}

/** Keys → `/studio?composition=…` href for Component studio (page template authoring). */
export function useLibraryComponentEditStudioHrefs(): Record<string, string> {
  return useLibraryComponentIndex().editStudioHrefByKey;
}

export function libraryDisplayNameForKey(
  labels: Record<string, string>,
  componentKey: string,
): string {
  const trimmed = componentKey.trim();
  if (trimmed === "") {
    return "Library block";
  }
  return labels[trimmed] ?? trimmed;
}

export function libraryComponentEditStudioHref(
  editHrefs: Record<string, string>,
  node: CompositionNode,
  pageTemplateStudio: boolean,
): string | null {
  if (
    !pageTemplateStudio ||
    node.definitionKey !== "primitive.libraryComponent"
  ) {
    return null;
  }
  const key =
    typeof node.propValues?.componentKey === "string"
      ? node.propValues.componentKey.trim()
      : "";
  if (key === "") {
    return null;
  }
  return editHrefs[key] ?? null;
}
