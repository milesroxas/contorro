import {
  type MigrateDownArgs,
  type MigrateUpArgs,
  sql,
} from "@payloadcms/db-postgres";

/**
 * Replaces flat `pages.content` (`pages_content` rows with `layout_slot_id`) with nested arrays:
 * `contentSlots` → `pages_content_slots` + `pages_content_slots_blocks` (one region per slot, blocks inside).
 *
 * Aligns with Payload’s nested `array` fields (see field docs) and removes duplicate slot selection UX.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "pages_content_slots" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "slot_id" varchar,
      CONSTRAINT "pages_content_slots_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id")
        ON DELETE cascade ON UPDATE no action
    );

    CREATE TABLE IF NOT EXISTS "pages_content_slots_blocks" (
      "_order" integer NOT NULL,
      "_parent_id" varchar NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "component_definition_id" integer,
      "editor_field_values" jsonb DEFAULT '{}'::jsonb,
      CONSTRAINT "pages_content_slots_blocks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_content_slots"("id")
        ON DELETE cascade ON UPDATE no action,
      CONSTRAINT "pages_content_slots_blocks_component_definition_id_components_id_fk" FOREIGN KEY ("component_definition_id") REFERENCES "public"."components"("id")
        ON DELETE set null ON UPDATE no action
    );

    CREATE INDEX IF NOT EXISTS "pages_content_slots_order_idx"
      ON "pages_content_slots" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "pages_content_slots_parent_id_idx"
      ON "pages_content_slots" USING btree ("_parent_id");

    CREATE INDEX IF NOT EXISTS "pages_content_slots_blocks_order_idx"
      ON "pages_content_slots_blocks" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "pages_content_slots_blocks_parent_id_idx"
      ON "pages_content_slots_blocks" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "pages_content_slots_blocks_component_definition_idx"
      ON "pages_content_slots_blocks" USING btree ("component_definition_id");

    CREATE TABLE IF NOT EXISTS "_pages_v_version_content_slots" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "slot_id" varchar,
      "_uuid" varchar,
      CONSTRAINT "_pages_v_version_content_slots_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id")
        ON DELETE cascade ON UPDATE no action
    );

    CREATE TABLE IF NOT EXISTS "_pages_v_version_content_slots_blocks" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "component_definition_id" integer,
      "editor_field_values" jsonb DEFAULT '{}'::jsonb,
      "_uuid" varchar,
      CONSTRAINT "_pages_v_version_content_slots_blocks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_version_content_slots"("id")
        ON DELETE cascade ON UPDATE no action,
      CONSTRAINT "_pages_v_version_content_slots_blocks_component_definition_id_components_id_fk" FOREIGN KEY ("component_definition_id") REFERENCES "public"."components"("id")
        ON DELETE set null ON UPDATE no action
    );

    CREATE INDEX IF NOT EXISTS "_pages_v_version_content_slots_order_idx"
      ON "_pages_v_version_content_slots" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "_pages_v_version_content_slots_parent_id_idx"
      ON "_pages_v_version_content_slots" USING btree ("_parent_id");

    CREATE INDEX IF NOT EXISTS "_pages_v_version_content_slots_blocks_order_idx"
      ON "_pages_v_version_content_slots_blocks" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "_pages_v_version_content_slots_blocks_parent_id_idx"
      ON "_pages_v_version_content_slots_blocks" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "_pages_v_version_content_slots_blocks_component_definiti_idx"
      ON "_pages_v_version_content_slots_blocks" USING btree ("component_definition_id");
  `);

  await db.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'pages_content'
      ) AND EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'pages_content' AND column_name = 'layout_slot_id'
      ) THEN
        INSERT INTO "pages_content_slots" ("_order", "_parent_id", "id", "slot_id")
        SELECT
          ROW_NUMBER() OVER (
            PARTITION BY g.page_parent
            ORDER BY g.min_ord, g.slot_key
          ) - 1,
          g.page_parent,
          md5('ps'::text || g.page_parent::text || '|' || g.slot_key)::varchar,
          g.slot_key
        FROM (
          SELECT
            pc."_parent_id" AS page_parent,
            COALESCE(pc."layout_slot_id", 'main') AS slot_key,
            MIN(pc."_order") AS min_ord
          FROM "pages_content" pc
          GROUP BY pc."_parent_id", COALESCE(pc."layout_slot_id", 'main')
        ) g;

        INSERT INTO "pages_content_slots_blocks" (
          "_order",
          "_parent_id",
          "id",
          "component_definition_id",
          "editor_field_values"
        )
        SELECT
          c."_order",
          ps."id",
          c."id",
          c."component_definition_id",
          COALESCE(c."editor_field_values", '{}'::jsonb)
        FROM "pages_content" c
        INNER JOIN "pages_content_slots" ps
          ON ps."_parent_id" = c."_parent_id"
          AND ps."slot_id" = COALESCE(c."layout_slot_id", 'main');

        DROP TABLE "pages_content" CASCADE;
      END IF;
    END
    $$;
  `);

  await db.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = '_pages_v_version_content'
      ) AND EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = '_pages_v_version_content' AND column_name = 'layout_slot_id'
      ) THEN
        INSERT INTO "_pages_v_version_content_slots" ("_order", "_parent_id", "slot_id", "_uuid")
        SELECT
          ROW_NUMBER() OVER (
            PARTITION BY g.version_parent
            ORDER BY g.min_ord, g.slot_key
          ) - 1,
          g.version_parent,
          g.slot_key,
          md5(random()::text || g.version_parent::text || g.slot_key)::varchar
        FROM (
          SELECT
            vc."_parent_id" AS version_parent,
            COALESCE(vc."layout_slot_id", 'main') AS slot_key,
            MIN(vc."_order") AS min_ord
          FROM "_pages_v_version_content" vc
          GROUP BY vc."_parent_id", COALESCE(vc."layout_slot_id", 'main')
        ) g;

        INSERT INTO "_pages_v_version_content_slots_blocks" (
          "_order",
          "_parent_id",
          "component_definition_id",
          "editor_field_values",
          "_uuid"
        )
        SELECT
          c."_order",
          ps."id",
          c."component_definition_id",
          COALESCE(c."editor_field_values", '{}'::jsonb),
          COALESCE(c."_uuid", md5(random()::text || c."id"::text)::varchar)
        FROM "_pages_v_version_content" c
        INNER JOIN "_pages_v_version_content_slots" ps
          ON ps."_parent_id" = c."_parent_id"
          AND ps."slot_id" = COALESCE(c."layout_slot_id", 'main');

        DROP TABLE "_pages_v_version_content" CASCADE;
      END IF;
    END
    $$;
  `);
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Not reversed: would need to flatten nested slot rows back onto `layout_slot_id` and restore exact row ids.
}
