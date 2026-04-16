/**
 * Coarse Payload field kinds returned by the studio collection-fields API
 * (`/api/studio/payload-collections/[slug]/fields`).
 */
export type CollectionFieldBindingKind =
  | "text"
  | "number"
  | "date"
  | "checkbox"
  | "select"
  | "upload"
  /** Harvested but not used for binding UI (e.g. relationship, point). */
  | "other";

export function primitiveSupportsCollectionFieldBinding(
  definitionKey: string,
): boolean {
  return primitiveCollectionBindingFieldKinds(definitionKey) !== null;
}

function primitiveCollectionBindingFieldKinds(
  definitionKey: string,
): ReadonlySet<CollectionFieldBindingKind> | null {
  switch (definitionKey) {
    case "primitive.text":
    case "primitive.heading":
    case "primitive.button":
      return new Set<CollectionFieldBindingKind>([
        "text",
        "number",
        "date",
        "checkbox",
        "select",
      ]);
    case "primitive.image":
      return new Set<CollectionFieldBindingKind>(["upload"]);
    case "primitive.video":
      return new Set<CollectionFieldBindingKind>(["text", "upload"]);
    default:
      return null;
  }
}

export function isCollectionFieldKindCompatibleWithPrimitive(
  definitionKey: string,
  kind: CollectionFieldBindingKind,
): boolean {
  const allowed = primitiveCollectionBindingFieldKinds(definitionKey);
  if (!allowed) {
    return false;
  }
  return allowed.has(kind);
}

export type CollectionFieldBindingSelectRow<
  T extends { name: string; label: string; kind: CollectionFieldBindingKind },
> = T & { incompatible?: boolean };

/**
 * Builds dropdown rows: compatible fields first (API order), plus the current
 * binding when it points at an incompatible field so the select stays valid.
 */
export function collectionFieldBindingSelectRows<
  T extends { name: string; label: string; kind: CollectionFieldBindingKind },
>(
  definitionKey: string,
  allFields: readonly T[],
  boundPath: string,
): {
  rows: CollectionFieldBindingSelectRow<T>[];
  incompatibleBinding: boolean;
} {
  const allowed = primitiveCollectionBindingFieldKinds(definitionKey);
  if (!allowed) {
    return { rows: [], incompatibleBinding: false };
  }

  const trimmed = boundPath.trim();
  const compatible = allFields.filter((f) => allowed.has(f.kind));
  const bound =
    trimmed !== "" ? allFields.find((f) => f.name === trimmed) : undefined;

  const incompatibleBinding = Boolean(bound && !allowed.has(bound.kind));

  const rows: CollectionFieldBindingSelectRow<T>[] = compatible.map((f) => ({
    ...f,
  }));

  if (bound && incompatibleBinding) {
    rows.unshift({ ...bound, incompatible: true });
  }

  return { rows, incompatibleBinding };
}
