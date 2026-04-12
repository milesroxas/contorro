import {
  type MigrateDownArgs,
  type MigrateUpArgs,
  sql,
} from "@payloadcms/db-postgres";

/**
 * Drops legacy catalog / visibility columns from `components` (superseded product model).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "components" DROP COLUMN IF EXISTS "visible_in_editor_catalog";
    ALTER TABLE "components" DROP COLUMN IF EXISTS "catalog_submitted_at";
    ALTER TABLE "components" DROP COLUMN IF EXISTS "catalog_review_status";
    ALTER TABLE "components" DROP COLUMN IF EXISTS "is_breaking_change";
    ALTER TABLE "components" DROP COLUMN IF EXISTS "dependency_impact_acknowledged_at";

    ALTER TABLE "_components_v" DROP COLUMN IF EXISTS "version_visible_in_editor_catalog";
    ALTER TABLE "_components_v" DROP COLUMN IF EXISTS "version_catalog_submitted_at";
    ALTER TABLE "_components_v" DROP COLUMN IF EXISTS "version_catalog_review_status";
    ALTER TABLE "_components_v" DROP COLUMN IF EXISTS "version_is_breaking_change";
    ALTER TABLE "_components_v" DROP COLUMN IF EXISTS "version_dependency_impact_acknowledged_at";

    DROP TYPE IF EXISTS "public"."enum_components_catalog_review_status";
    DROP TYPE IF EXISTS "public"."enum__components_v_version_catalog_review_status";
  `);
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Intentionally not reversed: restoring enums and defaults would require the prior defaults.
}
