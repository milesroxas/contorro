import {
  type MigrateDownArgs,
  type MigrateUpArgs,
  sql,
} from "@payloadcms/db-postgres";

/**
 * Removes the legacy `builder.compositions` mirror. Composition state is canonical
 * in Payload (`page-compositions`, `components`) and CMS `/api/studio/compositions/*`.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`DROP TABLE IF EXISTS builder.compositions CASCADE;`);
  await db.execute(sql`DROP SCHEMA IF EXISTS builder CASCADE;`);
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Restoring the mirror would duplicate the old builder migrations; not reversible here.
}
