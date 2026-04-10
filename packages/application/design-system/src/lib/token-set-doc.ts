import {
  type DesignTokenSet,
  createDesignTokenSet,
} from "@repo/domains-design-system";

export type DesignTokenSetPayloadDoc = {
  id?: string | number | null;
  title?: string | null;
  scopeKey?: string | null;
  /** Present when drafts/versions are enabled on the collection. */
  _status?: "draft" | "published" | string | null;
  tokens?: Array<{
    id?: string | null;
    key?: string | null;
    category?: string | null;
    resolvedValue?: string | null;
  }> | null;
  hasBeenPublished?: boolean | null;
};

export function toDesignTokenSetAggregate(
  doc: DesignTokenSetPayloadDoc,
): DesignTokenSet {
  const tokens =
    doc.tokens?.map((t) => ({
      key: String(t.key ?? ""),
      category: String(t.category ?? ""),
      resolvedValue: String(t.resolvedValue ?? ""),
    })) ?? [];

  return createDesignTokenSet({
    id: doc.id != null ? String(doc.id) : "",
    title: String(doc.title ?? ""),
    scopeKey: String(doc.scopeKey ?? ""),
    tokens,
    hasBeenPublished: Boolean(doc.hasBeenPublished),
  });
}
