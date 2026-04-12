import {
  type MigrateDownArgs,
  type MigrateUpArgs,
  sql,
} from "@payloadcms/db-postgres";

/**
 * Moves `pages.content` from the blocks shape (`designerComponent`) to an array field:
 * direct rows in `pages_content` / `_pages_v_version_content` without a block-type hop.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "pages_content" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "component_definition_id" integer,
      "slot_values" jsonb DEFAULT '{}'::jsonb
    );

    CREATE TABLE IF NOT EXISTS "_pages_v_version_content" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "component_definition_id" integer,
      "slot_values" jsonb DEFAULT '{}'::jsonb,
      "_uuid" varchar
    );

    DO $$ BEGIN
      ALTER TABLE "pages_content"
        ADD CONSTRAINT "pages_content_component_definition_id_component_definitions_id_fk"
        FOREIGN KEY ("component_definition_id") REFERENCES "public"."component_definitions"("id")
        ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      ALTER TABLE "pages_content"
        ADD CONSTRAINT "pages_content_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      ALTER TABLE "_pages_v_version_content"
        ADD CONSTRAINT "_pages_v_version_content_component_definition_id_component_definitions_id_fk"
        FOREIGN KEY ("component_definition_id") REFERENCES "public"."component_definitions"("id")
        ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      ALTER TABLE "_pages_v_version_content"
        ADD CONSTRAINT "_pages_v_version_content_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    CREATE INDEX IF NOT EXISTS "pages_content_order_idx"
      ON "pages_content" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "pages_content_parent_id_idx"
      ON "pages_content" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "pages_content_component_definition_idx"
      ON "pages_content" USING btree ("component_definition_id");

    CREATE INDEX IF NOT EXISTS "_pages_v_version_content_order_idx"
      ON "_pages_v_version_content" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "_pages_v_version_content_parent_id_idx"
      ON "_pages_v_version_content" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "_pages_v_version_content_component_definition_idx"
      ON "_pages_v_version_content" USING btree ("component_definition_id");
  `);

  await db.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'pages_blocks_designer_component'
      ) AND EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'pages_content'
      ) THEN
        INSERT INTO "pages_content" (
          "_order", "_parent_id", "id", "component_definition_id", "slot_values"
        )
        SELECT
          b."_order",
          b."_parent_id",
          b."id",
          b."component_definition_id",
          COALESCE(b."slot_values", '{}'::jsonb)
        FROM "pages_blocks_designer_component" b
        ON CONFLICT ("id") DO NOTHING;
      END IF;
    END
    $$;
  `);

  await db.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = '_pages_v_blocks_designer_component'
      ) AND EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = '_pages_v_version_content'
      ) THEN
        INSERT INTO "_pages_v_version_content" (
          "_order", "_parent_id", "component_definition_id", "slot_values", "_uuid"
        )
        SELECT
          b."_order",
          b."_parent_id",
          b."component_definition_id",
          COALESCE(b."slot_values", '{}'::jsonb),
          b."_uuid"
        FROM "_pages_v_blocks_designer_component" b;
      END IF;
    END
    $$;
  `);

  await db.execute(sql`
    DROP TABLE IF EXISTS "_pages_v_blocks_designer_component" CASCADE;
    DROP TABLE IF EXISTS "pages_blocks_designer_component" CASCADE;
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "pages_blocks_designer_component" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "_path" text NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "component_definition_id" integer,
      "slot_values" jsonb DEFAULT '{}'::jsonb,
      "block_name" varchar
    );

    CREATE TABLE IF NOT EXISTS "_pages_v_blocks_designer_component" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "_path" text NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "component_definition_id" integer,
      "slot_values" jsonb DEFAULT '{}'::jsonb,
      "_uuid" varchar,
      "block_name" varchar
    );
  `);

  await db.execute(sql`
    INSERT INTO "pages_blocks_designer_component" (
      "_order", "_parent_id", "_path", "id", "component_definition_id", "slot_values"
    )
    SELECT
      c."_order",
      c."_parent_id",
      'content',
      c."id",
      c."component_definition_id",
      COALESCE(c."slot_values", '{}'::jsonb)
    FROM "pages_content" c
    ON CONFLICT ("id") DO NOTHING;
  `);

  await db.execute(sql`
    DROP TABLE IF EXISTS "_pages_v_version_content" CASCADE;
    DROP TABLE IF EXISTS "pages_content" CASCADE;
  `);
}
