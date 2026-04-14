import {
  type MigrateDownArgs,
  type MigrateUpArgs,
  sql,
} from "@payloadcms/db-postgres";

/** One-time mirror of existing `component_revisions` rows into `builder.compositions` (ids `cr-<id>`). */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    INSERT INTO builder.compositions (
      id,
      title,
      slug,
      composition,
      catalog_submitted_at,
      catalog_review_status,
      created_at,
      updated_at
    )
    SELECT
      'cr-' || id::text,
      COALESCE(label, ''),
      'cr-' || id::text,
      composition,
      NULL,
      'none',
      created_at,
      updated_at
    FROM component_revisions
    WHERE composition IS NOT NULL
    ON CONFLICT (id) DO UPDATE SET
      title = excluded.title,
      slug = excluded.slug,
      composition = excluded.composition,
      updated_at = excluded.updated_at;
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DELETE FROM builder.compositions
    WHERE id LIKE 'cr-%';
  `);
}
