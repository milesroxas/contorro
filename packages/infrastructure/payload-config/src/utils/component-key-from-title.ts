import type { PayloadRequest } from "payload";

export function slugifyComponentKeyFromTitle(title: string): string {
  const t = title.trim();
  const slug = t
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
  return slug || "component";
}

/**
 * Allocates a component key from a slugified title. The unique index on
 * `components.key` is the real guard: we do one best-effort read (inside the
 * request transaction) for a friendly key, then fall back to a random suffix.
 * A losing race surfaces as the unique-constraint validation error on insert
 * instead of a TOCTOU scan loop.
 */
export async function ensureUniqueComponentKey(
  req: PayloadRequest,
  base: string,
): Promise<string> {
  const found = await req.payload.find({
    collection: "components",
    where: { key: { equals: base } },
    limit: 1,
    depth: 0,
    req,
    overrideAccess: true,
  });
  if (found.docs.length === 0) {
    return base;
  }
  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}
