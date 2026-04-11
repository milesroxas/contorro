import type { Payload } from "payload";

export async function logCatalogActivity(
  payload: Payload,
  entry: {
    resourceType:
      | "pageComposition"
      | "componentRevision"
      | "componentDefinition"
      | "page";
    resourceId: string;
    action:
      | "submit"
      | "approve"
      | "reject"
      | "publish"
      | "rollback"
      | "presence";
    actorId: string | number;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  await payload.create({
    collection: "catalog-activity",
    data: {
      resourceType: entry.resourceType,
      resourceId: entry.resourceId,
      action: entry.action,
      actor: entry.actorId,
      metadata: entry.metadata,
    },
    overrideAccess: true,
  });
}
