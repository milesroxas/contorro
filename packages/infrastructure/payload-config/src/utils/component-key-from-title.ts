import type { Payload } from "payload";
import { APIError } from "payload";

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

export async function ensureUniqueComponentKey(
  payload: Payload,
  base: string,
  excludeId?: string | number,
): Promise<string> {
  for (let n = 0; n < 64; n++) {
    const candidate = n === 0 ? base : `${base}-${n + 1}`;
    const found = await payload.find({
      collection: "components",
      where: {
        and: [
          { key: { equals: candidate } },
          ...(excludeId !== undefined
            ? [{ id: { not_equals: excludeId } }]
            : []),
        ],
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    });
    if (found.docs.length === 0) {
      return candidate;
    }
  }
  throw new APIError("Could not allocate a unique component key", 500);
}
