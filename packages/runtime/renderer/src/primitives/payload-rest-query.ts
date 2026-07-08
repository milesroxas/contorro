/** Builds `GET /api/:collection` query string for Payload `find` (where / sort / limit / depth). */

function appendDeep(
  params: URLSearchParams,
  keyPath: string,
  value: unknown,
): void {
  if (value === null || value === undefined) {
    return;
  }
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      appendDeep(params, `${keyPath}[${i}]`, value[i]);
    }
    return;
  }
  if (typeof value === "object") {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      appendDeep(params, `${keyPath}[${k}]`, v);
    }
    return;
  }
  params.append(keyPath, String(value));
}

export function buildPayloadCollectionFindUrl(
  collectionSlug: string,
  opts: {
    depth?: number;
    limit?: number;
    sort?: string;
    where?: Record<string, unknown>;
  },
): string {
  const clean = collectionSlug.trim().replace(/^\/+|\/+$/g, "");
  const params = new URLSearchParams();
  params.set("limit", String(opts.limit ?? 50));
  params.set("depth", String(opts.depth ?? 0));
  const sort = opts.sort?.trim();
  if (sort) {
    params.set("sort", sort);
  }
  const where = opts.where;
  if (where && Object.keys(where).length > 0) {
    appendDeep(params, "where", where);
  }
  return `/api/${encodeURIComponent(clean)}?${params.toString()}`;
}
