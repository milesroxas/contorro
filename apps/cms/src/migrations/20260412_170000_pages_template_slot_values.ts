import {
  type MigrateDownArgs,
  type MigrateUpArgs,
  sql,
} from "@payloadcms/db-postgres";

/** Slot fill-in JSON for page templates (`pages.templateSlotValues`). */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "pages"
      ADD COLUMN IF NOT EXISTS "template_slot_values" jsonb DEFAULT '{}'::jsonb;

    ALTER TABLE "_pages_v"
      ADD COLUMN IF NOT EXISTS "version_template_slot_values" jsonb DEFAULT '{}'::jsonb;
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "pages" DROP COLUMN IF EXISTS "template_slot_values";
    ALTER TABLE "_pages_v" DROP COLUMN IF EXISTS "version_template_slot_values";
  `);
}
