export type PayloadCollectionDocRef = {
  id: string;
  slug: string;
  label: string;
};

/**
 * Lists documents from a Payload REST collection (`GET /api/:slug`).
 * Used by Studio pickers and the collection primitive inspector.
 */
export async function fetchPayloadCollectionDocs(
  collectionSlug: string,
): Promise<PayloadCollectionDocRef[]> {
  const cleanSlug = collectionSlug.trim().replace(/^\/+|\/+$/g, "");
  if (!cleanSlug) {
    return [];
  }
  const res = await fetch(
    `/api/${encodeURIComponent(cleanSlug)}?depth=0&limit=50&sort=-updatedAt`,
    { credentials: "include" },
  );
  if (!res.ok) {
    throw new Error(`Failed to load ${cleanSlug} entries (${res.status})`);
  }
  const json = (await res.json()) as {
    docs?: Array<{
      id?: unknown;
      slug?: unknown;
      title?: unknown;
      name?: unknown;
      label?: unknown;
    }>;
  };
  const docs = Array.isArray(json.docs) ? json.docs : [];
  return docs.map((doc) => {
    const id =
      typeof doc.id === "string" || typeof doc.id === "number"
        ? String(doc.id)
        : "";
    const slug = typeof doc.slug === "string" ? doc.slug : "";
    const labelCandidate =
      typeof doc.title === "string"
        ? doc.title
        : typeof doc.name === "string"
          ? doc.name
          : typeof doc.label === "string"
            ? doc.label
            : slug || id;
    return {
      id,
      slug,
      label: labelCandidate,
    };
  });
}
