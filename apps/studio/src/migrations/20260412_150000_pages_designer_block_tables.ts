import {
  type MigrateDownArgs,
  type MigrateUpArgs,
  sql,
} from "@payloadcms/db-postgres";

/**
 * Relational tables for `pages.content` blocks field (`designerComponent`).
 * Payload stores blocks in `pages_blocks_*` / `_pages_v_blocks_*`, not a single jsonb column.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
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

    DO $$ BEGIN
      ALTER TABLE "pages_blocks_designer_component"
        ADD CONSTRAINT "pages_blocks_designer_component_component_definition_id_component_definitions_id_fk"
        FOREIGN KEY ("component_definition_id") REFERENCES "public"."component_definitions"("id")
        ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      ALTER TABLE "pages_blocks_designer_component"
        ADD CONSTRAINT "pages_blocks_designer_component_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      ALTER TABLE "_pages_v_blocks_designer_component"
        ADD CONSTRAINT "_pages_v_blocks_designer_component_component_definition_id_component_definitions_id_fk"
        FOREIGN KEY ("component_definition_id") REFERENCES "public"."component_definitions"("id")
        ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      ALTER TABLE "_pages_v_blocks_designer_component"
        ADD CONSTRAINT "_pages_v_blocks_designer_component_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    CREATE INDEX IF NOT EXISTS "pages_blocks_designer_component_order_idx"
      ON "pages_blocks_designer_component" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "pages_blocks_designer_component_parent_id_idx"
      ON "pages_blocks_designer_component" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "pages_blocks_designer_component_path_idx"
      ON "pages_blocks_designer_component" USING btree ("_path");
    CREATE INDEX IF NOT EXISTS "pages_blocks_designer_component_component_definition_idx"
      ON "pages_blocks_designer_component" USING btree ("component_definition_id");

    CREATE INDEX IF NOT EXISTS "_pages_v_blocks_designer_component_order_idx"
      ON "_pages_v_blocks_designer_component" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "_pages_v_blocks_designer_component_parent_id_idx"
      ON "_pages_v_blocks_designer_component" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "_pages_v_blocks_designer_component_path_idx"
      ON "_pages_v_blocks_designer_component" USING btree ("_path");
    CREATE INDEX IF NOT EXISTS "_pages_v_blocks_designer_component_component_definition_idx"
      ON "_pages_v_blocks_designer_component" USING btree ("component_definition_id");
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "_pages_v_blocks_designer_component" CASCADE;
    DROP TABLE IF EXISTS "pages_blocks_designer_component" CASCADE;
  `);
}
