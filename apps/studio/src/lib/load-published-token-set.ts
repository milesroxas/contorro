import type { DesignTokenSet as PayloadDesignTokenSet } from "@/payload-types";
import type { Payload } from "payload";

/**
 * Resolves a published token set for the design-system preview: global default, else first published set.
 */
export async function loadPublishedTokenSetForPreview(
  payload: Payload,
): Promise<PayloadDesignTokenSet | null> {
  const global = await payload.findGlobal({
    slug: "design-system-settings",
    depth: 1,
    overrideAccess: true,
  });

  const rel = global.defaultTokenSet;
  if (
    rel &&
    typeof rel === "object" &&
    "tokens" in rel &&
    Array.isArray(rel.tokens)
  ) {
    const doc = rel as PayloadDesignTokenSet;
    if (doc._status === "published" && doc.tokens.length > 0) {
      return doc;
    }
  }

  const found = await payload.find({
    collection: "design-token-sets",
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: {
      _status: {
        equals: "published",
      },
    },
  });

  const doc = found.docs[0];
  if (!doc || !doc.tokens?.length) {
    return null;
  }

  return doc as PayloadDesignTokenSet;
}
