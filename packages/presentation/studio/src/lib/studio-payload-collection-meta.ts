export type StudioPayloadCollectionMeta = {
  slug: string;
  label: string;
};

export type StudioPayloadCollectionFieldMeta = {
  name: string;
  label: string;
  kind: "text" | "number" | "date" | "checkbox" | "select" | "upload" | "other";
};

export async function fetchStudioPayloadCollections(): Promise<
  StudioPayloadCollectionMeta[]
> {
  const res = await fetch("/api/studio/payload-collections", {
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(`Failed to load collections (${res.status})`);
  }
  const json = (await res.json()) as {
    collections?: StudioPayloadCollectionMeta[];
  };
  return Array.isArray(json.collections) ? json.collections : [];
}

export async function fetchStudioPayloadCollectionFields(
  slug: string,
): Promise<StudioPayloadCollectionFieldMeta[]> {
  const clean = slug.trim();
  if (!clean) {
    return [];
  }
  const res = await fetch(
    `/api/studio/payload-collections/${encodeURIComponent(clean)}/fields`,
    { credentials: "include" },
  );
  if (!res.ok) {
    throw new Error(`Failed to load fields (${res.status})`);
  }
  const json = (await res.json()) as {
    fields?: StudioPayloadCollectionFieldMeta[];
  };
  return Array.isArray(json.fields) ? json.fields : [];
}
