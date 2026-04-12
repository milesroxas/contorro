import {
  type MigrateDownArgs,
  type MigrateUpArgs,
  sql,
} from "@payloadcms/db-postgres";

/** Removes the redundant `templates` collection; page templates are `page-compositions` only. */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_templates_fk";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_templates_id_idx";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "templates_id";
    DROP TABLE IF EXISTS "_templates_v" CASCADE;
    DROP TABLE IF EXISTS "templates" CASCADE;
    DROP TYPE IF EXISTS "public"."enum__templates_v_version_status";
    DROP TYPE IF EXISTS "public"."enum_templates_status";
  `);
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Restoring dropped enums/tables would duplicate the old phase4 migration; not reversible here.
}
