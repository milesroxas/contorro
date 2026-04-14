import {
  type MigrateDownArgs,
  type MigrateUpArgs,
  sql,
} from "@payloadcms/db-postgres";

/** D.4–D.6 — template composition on definitions/revisions (page blocks use relational tables; see 20260412_150000). */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "component_definitions" ADD COLUMN IF NOT EXISTS "composition" jsonb;
    ALTER TABLE "component_revisions" ADD COLUMN IF NOT EXISTS "composition" jsonb;
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "component_revisions" DROP COLUMN IF EXISTS "composition";
    ALTER TABLE "component_definitions" DROP COLUMN IF EXISTS "composition";
  `);
}
