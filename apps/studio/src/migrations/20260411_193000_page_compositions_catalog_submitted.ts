import {
  type MigrateDownArgs,
  type MigrateUpArgs,
  sql,
} from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "page_compositions" ADD COLUMN "catalog_submitted_at" timestamp(3) with time zone;
  ALTER TABLE "_page_compositions_v" ADD COLUMN "version_catalog_submitted_at" timestamp(3) with time zone;
`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "page_compositions" DROP COLUMN IF EXISTS "catalog_submitted_at";
  ALTER TABLE "_page_compositions_v" DROP COLUMN IF EXISTS "version_catalog_submitted_at";
`);
}
