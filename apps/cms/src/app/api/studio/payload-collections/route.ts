import { getPayload } from "payload";

import config from "@/payload.config";

export type StudioPayloadCollectionMeta = {
  slug: string;
  label: string;
};

function isExcludedCollectionSlug(slug: string): boolean {
  if (slug === "users") {
    return true;
  }
  return slug.startsWith("payload-");
}

/**
 * Payload-backed collection slugs + labels for Studio UI (e.g. collection primitive).
 */
export async function GET(request: Request) {
  const payloadConfig = await config;
  const payload = await getPayload({ config: payloadConfig });
  const { user } = await payload.auth({ headers: request.headers });
  if (!user) {
    return Response.json(
      { error: { code: "UNAUTHORIZED" as const } },
      { status: 401 },
    );
  }
  const role = (user as { role?: string }).role;
  if (role !== "admin" && role !== "designer") {
    return Response.json(
      { error: { code: "FORBIDDEN" as const } },
      { status: 403 },
    );
  }

  const collections: StudioPayloadCollectionMeta[] = [];
  for (const col of payload.config.collections) {
    if (isExcludedCollectionSlug(col.slug)) {
      continue;
    }
    const label =
      typeof col.labels?.plural === "string" && col.labels.plural.trim() !== ""
        ? col.labels.plural
        : col.slug;
    collections.push({ slug: col.slug, label });
  }
  collections.sort((a, b) => a.label.localeCompare(b.label));

  return Response.json({ collections });
}
