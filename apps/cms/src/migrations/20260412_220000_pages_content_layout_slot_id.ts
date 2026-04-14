import {
  type MigrateDownArgs,
  type MigrateUpArgs,
  sql,
} from "@payloadcms/db-postgres";

/** Adds `layout_slot_id` on page content rows so blocks can target named layout slots in the template. */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "pages_content" ADD COLUMN IF NOT EXISTS "layout_slot_id" varchar DEFAULT 'main';
    ALTER TABLE "_pages_v_version_content" ADD COLUMN IF NOT EXISTS "layout_slot_id" varchar DEFAULT 'main';
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "pages_content" DROP COLUMN IF EXISTS "layout_slot_id";
    ALTER TABLE "_pages_v_version_content" DROP COLUMN IF EXISTS "layout_slot_id";
  `);
}
