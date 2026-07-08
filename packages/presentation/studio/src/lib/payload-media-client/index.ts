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

function toMediaListItem(value: {
  id?: unknown;
  url?: unknown;
  alt?: unknown;
  filename?: unknown;
}): MediaListItem | null {
  const id = typeof value.id === "number" ? value.id : Number.NaN;
  const url = typeof value.url === "string" ? value.url : "";
  if (!Number.isFinite(id) || url.length === 0) {
    return null;
  }
  return {
    id,
    url,
    alt: typeof value.alt === "string" ? value.alt : "",
    filename: typeof value.filename === "string" ? value.filename : "",
  };
}

/**
 * Normalizes Payload `upload` / relationship values to a numeric media id.
 * Handles plain numbers, digit-only strings, and populated `{ id }` shapes.
 */
export function parsePayloadMediaRefId(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return raw;
  }
  if (typeof raw === "string" && /^\d+$/.test(raw)) {
    return Number.parseInt(raw, 10);
  }
  if (
    raw &&
    typeof raw === "object" &&
    "id" in raw &&
    typeof (raw as { id: unknown }).id === "number" &&
    Number.isFinite((raw as { id: number }).id)
  ) {
    return (raw as { id: number }).id;
  }
  return null;
}

export async function fetchMediaRecordById(
  mediaId: number,
): Promise<MediaListItem | null> {
  const res = await fetch(`/api/media/${mediaId}?depth=0`, {
    credentials: "include",
  });
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error(`Failed to load selected media (${res.status})`);
  }
  const json = (await res.json()) as {
    doc?: {
      id?: unknown;
      url?: unknown;
      alt?: unknown;
      filename?: unknown;
    };
    id?: unknown;
    url?: unknown;
    alt?: unknown;
    filename?: unknown;
  };
  const doc =
    json.doc && typeof json.doc === "object" && !Array.isArray(json.doc)
      ? json.doc
      : json;
  return toMediaListItem(doc);
}

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
    .map((doc) => toMediaListItem(doc))
    .filter((doc): doc is MediaListItem => doc !== null);
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
