import {
  type MigrateDownArgs,
  type MigrateUpArgs,
  sql,
} from "@payloadcms/db-postgres";

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_templates_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__templates_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "templates" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"description" varchar,
  	"source_composition_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_templates_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_templates_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_description" varchar,
  	"version_source_composition_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__templates_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  ALTER TABLE "component_definitions" ADD COLUMN "visible_in_editor_catalog" boolean DEFAULT false;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "templates_id" integer;
  ALTER TABLE "templates" ADD CONSTRAINT "templates_source_composition_id_page_compositions_id_fk" FOREIGN KEY ("source_composition_id") REFERENCES "public"."page_compositions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_templates_v" ADD CONSTRAINT "_templates_v_parent_id_templates_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."templates"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_templates_v" ADD CONSTRAINT "_templates_v_version_source_composition_id_page_compositions_id_fk" FOREIGN KEY ("version_source_composition_id") REFERENCES "public"."page_compositions"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "templates_slug_idx" ON "templates" USING btree ("slug");
  CREATE INDEX "templates_source_composition_idx" ON "templates" USING btree ("source_composition_id");
  CREATE INDEX "templates_updated_at_idx" ON "templates" USING btree ("updated_at");
  CREATE INDEX "templates_created_at_idx" ON "templates" USING btree ("created_at");
  CREATE INDEX "templates__status_idx" ON "templates" USING btree ("_status");
  CREATE INDEX "_templates_v_parent_idx" ON "_templates_v" USING btree ("parent_id");
  CREATE INDEX "_templates_v_version_version_slug_idx" ON "_templates_v" USING btree ("version_slug");
  CREATE INDEX "_templates_v_version_version_source_composition_idx" ON "_templates_v" USING btree ("version_source_composition_id");
  CREATE INDEX "_templates_v_version_version_updated_at_idx" ON "_templates_v" USING btree ("version_updated_at");
  CREATE INDEX "_templates_v_version_version_created_at_idx" ON "_templates_v" USING btree ("version_created_at");
  CREATE INDEX "_templates_v_version_version__status_idx" ON "_templates_v" USING btree ("version__status");
  CREATE INDEX "_templates_v_created_at_idx" ON "_templates_v" USING btree ("created_at");
  CREATE INDEX "_templates_v_updated_at_idx" ON "_templates_v" USING btree ("updated_at");
  CREATE INDEX "_templates_v_latest_idx" ON "_templates_v" USING btree ("latest");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_templates_fk" FOREIGN KEY ("templates_id") REFERENCES "public"."templates"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_templates_id_idx" ON "payload_locked_documents_rels" USING btree ("templates_id");
`);
}

export async function down({
  db,
  payload,
  req,
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "templates" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_templates_v" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "templates" CASCADE;
  DROP TABLE "_templates_v" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_templates_fk";
  
  DROP INDEX "payload_locked_documents_rels_templates_id_idx";
  ALTER TABLE "component_definitions" DROP COLUMN "visible_in_editor_catalog";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "templates_id";
  DROP TYPE "public"."enum_templates_status";
  DROP TYPE "public"."enum__templates_v_version_status";
`);
}
