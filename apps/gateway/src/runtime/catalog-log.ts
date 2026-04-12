import type { Pool } from "pg";

export async function logCatalogActivitySql(
  pool: Pool,
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
  const actorId =
    typeof entry.actorId === "number" ? entry.actorId : Number(entry.actorId);
  await pool.query(
    `insert into catalog_activity (
      resource_type,
      resource_id,
      action,
      actor_id,
      metadata,
      updated_at,
      created_at
    ) values ($1, $2, $3, $4, $5::jsonb, now(), now())`,
    [
      entry.resourceType,
      entry.resourceId,
      entry.action,
      actorId,
      JSON.stringify(entry.metadata ?? null),
    ],
  );
}
