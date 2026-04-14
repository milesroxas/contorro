import {
  type MigrateDownArgs,
  type MigrateUpArgs,
  sql,
} from "@payloadcms/db-postgres";

/**
 * Align `visible_in_editor_catalog` with definitions that already had a published
 * revision (block picker previously inferred visibility from revisions).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "component_definitions" AS d
    SET "visible_in_editor_catalog" = true
    WHERE EXISTS (
      SELECT 1
      FROM "component_revisions" AS r
      WHERE r.definition_id = d.id
        AND r.status = 'published'
    );
  `);
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Not reversible without storing prior checkbox values.
}
