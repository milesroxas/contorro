export type MediaRecord = {
  id: number;
  url: string;
  alt: string;
};

export type MediaListItem = {
  id: number;
  url: string;
  alt: string;
  filename: string;
};

export async function fetchMediaRecords(): Promise<MediaListItem[]> {
  const res = await fetch("/api/media?depth=0&limit=50&sort=-updatedAt", {
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(`Failed to load media (${res.status})`);
  }
  const json = (await res.json()) as {
    docs?: Array<{
      id?: unknown;
      url?: unknown;
      alt?: unknown;
      filename?: unknown;
    }>;
  };
  const docs = Array.isArray(json.docs) ? json.docs : [];
  return docs
    .map((doc) => ({
      id: typeof doc.id === "number" ? doc.id : Number.NaN,
      url: typeof doc.url === "string" ? doc.url : "",
      alt: typeof doc.alt === "string" ? doc.alt : "",
      filename: typeof doc.filename === "string" ? doc.filename : "",
    }))
    .filter((doc) => Number.isFinite(doc.id) && doc.url.length > 0);
}

export async function uploadMediaFile(
  file: File,
  alt: string,
): Promise<MediaRecord> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("_payload", JSON.stringify({ alt: alt.trim() || file.name }));
  const res = await fetch("/api/media", {
    method: "POST",
    body: formData,
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(`Upload failed (${res.status})`);
  }
  const json = (await res.json()) as {
    doc?: { id?: unknown; url?: unknown; alt?: unknown };
    id?: unknown;
    url?: unknown;
    alt?: unknown;
  };
  const doc =
    json.doc && typeof json.doc === "object" && !Array.isArray(json.doc)
      ? json.doc
      : json;
  if (typeof doc.id !== "number" || typeof doc.url !== "string") {
    throw new Error("Invalid upload response");
  }
  return {
    id: doc.id,
    url: doc.url,
    alt: typeof doc.alt === "string" ? doc.alt : "",
  };
}
