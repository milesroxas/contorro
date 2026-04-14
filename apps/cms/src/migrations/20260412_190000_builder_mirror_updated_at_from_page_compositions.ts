import {
  type MigrateDownArgs,
  type MigrateUpArgs,
  sql,
} from "@payloadcms/db-postgres";

/**
 * Align `builder.compositions.updated_at` with `page_compositions.updated_at` so gateway
 * If-Match matches Payload (mirror previously used `now()` in the sync hook).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    UPDATE builder.compositions AS b
    SET updated_at = p.updated_at
    FROM page_compositions AS p
    WHERE p.id::text = b.id;
  `);
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Not reversible without storing prior mirror timestamps.
}
