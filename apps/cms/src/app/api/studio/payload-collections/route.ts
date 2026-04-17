import { requireStudioDesigner } from "@/app/api/studio/_lib/studio-auth";

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
  const auth = await requireStudioDesigner(request);
  if (auth instanceof Response) {
    return auth;
  }
  const { payload } = auth;

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
