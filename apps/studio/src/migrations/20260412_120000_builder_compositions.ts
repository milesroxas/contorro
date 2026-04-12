import {
  type MigrateDownArgs,
  type MigrateUpArgs,
  sql,
} from "@payloadcms/db-postgres";

/** v0.4 — `builder.compositions` mirror of `page_compositions` for gateway Drizzle access. */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE SCHEMA IF NOT EXISTS builder;
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS builder.compositions (
      id text PRIMARY KEY NOT NULL,
      title varchar NOT NULL,
      slug varchar NOT NULL,
      composition jsonb NOT NULL,
      catalog_submitted_at timestamp(3) with time zone,
      catalog_review_status varchar NOT NULL DEFAULT 'none',
      created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
      updated_at timestamp(3) with time zone DEFAULT now() NOT NULL
    );
  `);
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS builder_compositions_slug_idx
      ON builder.compositions USING btree (slug);
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS builder_compositions_updated_at_idx
      ON builder.compositions USING btree (updated_at);
  `);
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
      id::text,
      COALESCE(title, ''),
      COALESCE(slug, ''),
      COALESCE(composition, '{}'::jsonb),
      catalog_submitted_at,
      COALESCE(catalog_review_status::text, 'none'),
      created_at,
      updated_at
    FROM page_compositions
    ON CONFLICT (id) DO NOTHING;
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP TABLE IF EXISTS builder.compositions CASCADE;`);
  await db.execute(sql`DROP SCHEMA IF EXISTS builder CASCADE;`);
}
