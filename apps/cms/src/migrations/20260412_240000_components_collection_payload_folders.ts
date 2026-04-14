import {
  type MigrateDownArgs,
  type MigrateUpArgs,
  sql,
} from "@payloadcms/db-postgres";

/**
 * Aligns Postgres with the `components` collection (replaces component_definitions/revisions)
 * and Payload folders (`payload_folders`), including `payload_locked_documents_rels` polymorphic
 * columns expected by `@payloadcms/db-postgres` for the current config.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_payload_folders_folder_type" AS ENUM('components');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_components_catalog_review_status" AS ENUM('none', 'submitted', 'approved', 'rejected');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_components_status" AS ENUM('draft', 'published');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum__components_v_version_catalog_review_status" AS ENUM('none', 'submitted', 'approved', 'rejected');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum__components_v_version_status" AS ENUM('draft', 'published');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE TABLE IF NOT EXISTS "payload_folders" (
      "id" serial PRIMARY KEY NOT NULL,
      "name" varchar NOT NULL,
      "folder_id" integer,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    DO $$ BEGIN
      ALTER TABLE "payload_folders"
        ADD CONSTRAINT "payload_folders_folder_id_payload_folders_id_fk"
        FOREIGN KEY ("folder_id") REFERENCES "public"."payload_folders"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "payload_folders_name_idx" ON "payload_folders" USING btree ("name");
    CREATE INDEX IF NOT EXISTS "payload_folders_folder_idx" ON "payload_folders" USING btree ("folder_id");
    CREATE INDEX IF NOT EXISTS "payload_folders_updated_at_idx" ON "payload_folders" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "payload_folders_created_at_idx" ON "payload_folders" USING btree ("created_at");

    CREATE TABLE IF NOT EXISTS "payload_folders_folder_type" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer NOT NULL,
      "parent_id" integer NOT NULL,
      "value" "enum_payload_folders_folder_type"
    );

    DO $$ BEGIN
      ALTER TABLE "payload_folders_folder_type"
        ADD CONSTRAINT "payload_folders_folder_type_parent_fk"
        FOREIGN KEY ("parent_id") REFERENCES "public"."payload_folders"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "payload_folders_folder_type_order_idx" ON "payload_folders_folder_type" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "payload_folders_folder_type_parent_idx" ON "payload_folders_folder_type" USING btree ("parent_id");

    ALTER TABLE "component_definitions"
      ADD COLUMN IF NOT EXISTS "catalog_submitted_at" timestamp(3) with time zone;
    ALTER TABLE "component_definitions"
      ADD COLUMN IF NOT EXISTS "catalog_review_status" "enum_components_catalog_review_status" DEFAULT 'none';
    ALTER TABLE "component_definitions"
      ADD COLUMN IF NOT EXISTS "is_breaking_change" boolean DEFAULT false;
    ALTER TABLE "component_definitions"
      ADD COLUMN IF NOT EXISTS "dependency_impact_acknowledged_at" timestamp(3) with time zone;
    ALTER TABLE "component_definitions"
      ADD COLUMN IF NOT EXISTS "last_touched_by_id" integer;
    ALTER TABLE "component_definitions"
      ADD COLUMN IF NOT EXISTS "folder_id" integer;
    ALTER TABLE "component_definitions"
      ADD COLUMN IF NOT EXISTS "_status" "enum_components_status" DEFAULT 'draft';

    DO $$ BEGIN
      ALTER TABLE "component_definitions"
        ADD CONSTRAINT "components_last_touched_by_id_users_id_fk"
        FOREIGN KEY ("last_touched_by_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "component_definitions"
        ADD CONSTRAINT "components_folder_id_payload_folders_id_fk"
        FOREIGN KEY ("folder_id") REFERENCES "public"."payload_folders"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "component_definitions_last_touched_by_idx" ON "component_definitions" USING btree ("last_touched_by_id");
    CREATE INDEX IF NOT EXISTS "component_definitions_folder_idx" ON "component_definitions" USING btree ("folder_id");
    CREATE INDEX IF NOT EXISTS "component_definitions__status_idx" ON "component_definitions" USING btree ("_status");

    ALTER TABLE "component_definitions" RENAME TO "components";
    ALTER TABLE "components" RENAME CONSTRAINT "component_definitions_pkey" TO "components_pkey";

    DO $$ BEGIN
      ALTER INDEX "component_definitions_key_idx" RENAME TO "components_key_idx";
    EXCEPTION
      WHEN undefined_object THEN null;
    END $$;
    DO $$ BEGIN
      ALTER INDEX "component_definitions_updated_at_idx" RENAME TO "components_updated_at_idx";
    EXCEPTION
      WHEN undefined_object THEN null;
    END $$;
    DO $$ BEGIN
      ALTER INDEX "component_definitions_created_at_idx" RENAME TO "components_created_at_idx";
    EXCEPTION
      WHEN undefined_object THEN null;
    END $$;
    DO $$ BEGIN
      ALTER INDEX "component_definitions_last_touched_by_idx" RENAME TO "components_last_touched_by_idx";
    EXCEPTION
      WHEN undefined_object THEN null;
    END $$;
    DO $$ BEGIN
      ALTER INDEX "component_definitions_folder_idx" RENAME TO "components_folder_idx";
    EXCEPTION
      WHEN undefined_object THEN null;
    END $$;
    DO $$ BEGIN
      ALTER INDEX "component_definitions__status_idx" RENAME TO "components__status_idx";
    EXCEPTION
      WHEN undefined_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER SEQUENCE "component_definitions_id_seq" RENAME TO "components_id_seq";
    EXCEPTION
      WHEN undefined_object THEN null;
    END $$;

    ALTER TABLE "components" ALTER COLUMN "id" SET DEFAULT nextval('components_id_seq');
    ALTER SEQUENCE "components_id_seq" OWNED BY "components"."id";

    CREATE TABLE IF NOT EXISTS "_components_v" (
      "id" serial PRIMARY KEY NOT NULL,
      "parent_id" integer,
      "version_display_name" varchar,
      "version_key" varchar,
      "version_prop_contract" jsonb,
      "version_editor_fields" jsonb,
      "version_composition" jsonb,
      "version_visible_in_editor_catalog" boolean DEFAULT false,
      "version_catalog_submitted_at" timestamp(3) with time zone,
      "version_catalog_review_status" "enum__components_v_version_catalog_review_status" DEFAULT 'none',
      "version_is_breaking_change" boolean DEFAULT false,
      "version_dependency_impact_acknowledged_at" timestamp(3) with time zone,
      "version_last_touched_by_id" integer,
      "version_folder_id" integer,
      "version_updated_at" timestamp(3) with time zone,
      "version_created_at" timestamp(3) with time zone,
      "version__status" "enum__components_v_version_status" DEFAULT 'draft',
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "latest" boolean
    );

    DO $$ BEGIN
      ALTER TABLE "_components_v"
        ADD CONSTRAINT "_components_v_parent_id_components_id_fk"
        FOREIGN KEY ("parent_id") REFERENCES "public"."components"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "_components_v"
        ADD CONSTRAINT "_components_v_version_last_touched_by_id_users_id_fk"
        FOREIGN KEY ("version_last_touched_by_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "_components_v"
        ADD CONSTRAINT "_components_v_version_folder_id_payload_folders_id_fk"
        FOREIGN KEY ("version_folder_id") REFERENCES "public"."payload_folders"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "_components_v_parent_idx" ON "_components_v" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "_components_v_version_version_key_idx" ON "_components_v" USING btree ("version_key");
    CREATE INDEX IF NOT EXISTS "_components_v_version_version_last_touched_by_idx" ON "_components_v" USING btree ("version_last_touched_by_id");
    CREATE INDEX IF NOT EXISTS "_components_v_version_version_folder_idx" ON "_components_v" USING btree ("version_folder_id");
    CREATE INDEX IF NOT EXISTS "_components_v_version_version_updated_at_idx" ON "_components_v" USING btree ("version_updated_at");
    CREATE INDEX IF NOT EXISTS "_components_v_version_version_created_at_idx" ON "_components_v" USING btree ("version_created_at");
    CREATE INDEX IF NOT EXISTS "_components_v_version_version__status_idx" ON "_components_v" USING btree ("version__status");
    CREATE INDEX IF NOT EXISTS "_components_v_created_at_idx" ON "_components_v" USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "_components_v_updated_at_idx" ON "_components_v" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "_components_v_latest_idx" ON "_components_v" USING btree ("latest");

    INSERT INTO "_components_v" (
      "parent_id",
      "version_display_name",
      "version_key",
      "version_prop_contract",
      "version_editor_fields",
      "version_composition",
      "version_visible_in_editor_catalog",
      "version_catalog_submitted_at",
      "version_catalog_review_status",
      "version_is_breaking_change",
      "version_dependency_impact_acknowledged_at",
      "version_last_touched_by_id",
      "version_folder_id",
      "version_updated_at",
      "version_created_at",
      "version__status",
      "created_at",
      "updated_at",
      "latest"
    )
    SELECT
      r."definition_id",
      r."label",
      c."key",
      r."prop_contract",
      r."editor_fields",
      r."composition",
      c."visible_in_editor_catalog",
      NULL,
      'none'::"enum__components_v_version_catalog_review_status",
      COALESCE(r."is_breaking_change", false),
      r."dependency_impact_acknowledged_at",
      NULL,
      NULL,
      r."updated_at",
      r."created_at",
      CASE r."status"::text
        WHEN 'draft' THEN 'draft'::"enum__components_v_version_status"
        WHEN 'published' THEN 'published'::"enum__components_v_version_status"
        ELSE 'draft'::"enum__components_v_version_status"
      END,
      r."created_at",
      r."updated_at",
      (ROW_NUMBER() OVER (PARTITION BY r."definition_id" ORDER BY r."updated_at" DESC, r."id" DESC) = 1)
    FROM "component_revisions" r
    INNER JOIN "components" c ON c."id" = r."definition_id";

    ALTER TABLE "pages_content" DROP CONSTRAINT IF EXISTS "pages_content_component_definition_id_component_definitions_id_";
    ALTER TABLE "pages_content"
      ADD CONSTRAINT "pages_content_component_definition_id_components_id_fk"
      FOREIGN KEY ("component_definition_id") REFERENCES "public"."components"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

    ALTER TABLE "_pages_v_version_content" DROP CONSTRAINT IF EXISTS "_pages_v_version_content_component_definition_id_component_defi";
    ALTER TABLE "_pages_v_version_content"
      ADD CONSTRAINT "_pages_v_version_content_component_definition_id_components_id_fk"
      FOREIGN KEY ("component_definition_id") REFERENCES "public"."components"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

    ALTER TABLE "publish_jobs" ADD COLUMN IF NOT EXISTS "target_component_id" integer;

    UPDATE "publish_jobs" pj
    SET "target_component_id" = cr."definition_id"
    FROM "component_revisions" cr
    WHERE pj."target_revision_id" = cr."id";

    ALTER TABLE "publish_jobs" DROP CONSTRAINT IF EXISTS "publish_jobs_target_revision_id_component_revisions_id_fk";

    ALTER TABLE "publish_jobs" DROP COLUMN IF EXISTS "target_revision_id";

    DO $$ BEGIN
      ALTER TABLE "publish_jobs"
        ADD CONSTRAINT "publish_jobs_target_component_id_components_id_fk"
        FOREIGN KEY ("target_component_id") REFERENCES "public"."components"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "publish_jobs_target_component_idx" ON "publish_jobs" USING btree ("target_component_id");

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "components_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "payload_folders_id" integer;

    UPDATE "payload_locked_documents_rels" rel
    SET "components_id" = COALESCE(
      rel."component_definitions_id",
      (SELECT cr."definition_id" FROM "component_revisions" cr WHERE cr."id" = rel."component_revisions_id")
    )
    WHERE rel."components_id" IS NULL
      AND (rel."component_definitions_id" IS NOT NULL OR rel."component_revisions_id" IS NOT NULL);

    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_component_definitions_fk";
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_component_revisions_fk";

    DROP INDEX IF EXISTS "payload_locked_documents_rels_component_definitions_id_idx";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_component_revisions_id_idx";

    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "component_definitions_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "component_revisions_id";

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_components_fk"
        FOREIGN KEY ("components_id") REFERENCES "public"."components"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_payload_folders_fk"
        FOREIGN KEY ("payload_folders_id") REFERENCES "public"."payload_folders"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_components_id_idx" ON "payload_locked_documents_rels" USING btree ("components_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_payload_folders_id_idx" ON "payload_locked_documents_rels" USING btree ("payload_folders_id");

    DROP TABLE "component_revisions" CASCADE;

    DROP TYPE IF EXISTS "public"."enum_component_revisions_status";
  `);
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Not reversible without restoring component_revisions and publish_jobs.target_revision_id.
}
