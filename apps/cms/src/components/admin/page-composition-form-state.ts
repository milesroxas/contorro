import type { FormState } from "payload";

import type { PageComposition } from "@repo/contracts-zod";
import { PageCompositionSchema } from "@repo/contracts-zod";

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complexity cleanup backlog.
export function extractPageCompositionId(raw: unknown): number | undefined {
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return raw;
  }
  if (typeof raw === "string" && /^\d+$/.test(raw)) {
    return Number.parseInt(raw, 10);
  }
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    if ("id" in raw) {
      const id = (raw as { id: unknown }).id;
      if (typeof id === "number" && Number.isFinite(id)) {
        return id;
      }
      if (typeof id === "string" && /^\d+$/.test(id)) {
        return Number.parseInt(id, 10);
      }
    }
    if ("value" in raw) {
      return extractPageCompositionId((raw as { value: unknown }).value);
    }
  }
  return undefined;
}

function isPresentRelationshipValue(v: unknown): boolean {
  return v !== undefined && v !== null && v !== "";
}

/** Any populated `pageComposition` in the document form (draft/version skew). */
export function pageCompositionLooseFromFields(fields: FormState): unknown {
  const keys = Object.keys(fields).filter(
    (k) => k === "pageComposition" || k.endsWith(".pageComposition"),
  );
  keys.sort((a, b) => {
    const rank = (x: string) =>
      x === "version.pageComposition" ? 0 : x === "pageComposition" ? 1 : 2;
    return rank(a) - rank(b);
  });
  for (const key of keys) {
    const v = fields[key]?.value as unknown;
    if (isPresentRelationshipValue(v)) {
      return v;
    }
  }
  return undefined;
}

export function pageCompositionFromDocumentData(data: unknown): unknown {
  if (!data || typeof data !== "object") {
    return undefined;
  }
  const row = data as {
    pageComposition?: unknown;
    version?: { pageComposition?: unknown };
  };
  const top = row.pageComposition;
  if (top !== undefined && top !== null && top !== "") {
    return top;
  }
  const v = row.version?.pageComposition;
  if (v !== undefined && v !== null && v !== "") {
    return v;
  }
  return undefined;
}

export function parseEmbeddedPageComposition(
  raw: unknown,
): PageComposition | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }
  const comp = (raw as { composition?: unknown }).composition;
  if (comp === undefined || comp === null) {
    return null;
  }
  const parsed = PageCompositionSchema.safeParse(comp);
  return parsed.success ? parsed.data : null;
}
