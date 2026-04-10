import {
  type MigrateDownArgs,
  type MigrateUpArgs,
  sql,
} from "@payloadcms/db-postgres";

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_component_revisions_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_page_compositions_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__page_compositions_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "component_definitions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"display_name" varchar NOT NULL,
  	"prop_contract" jsonb NOT NULL,
  	"slot_contract" jsonb NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "component_revisions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"definition_id" integer NOT NULL,
  	"label" varchar NOT NULL,
  	"prop_contract" jsonb,
  	"slot_contract" jsonb,
  	"status" "enum_component_revisions_status" DEFAULT 'draft' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "page_compositions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"composition" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_page_compositions_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_page_compositions_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_composition" jsonb,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__page_compositions_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "component_definitions_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "component_revisions_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "page_compositions_id" integer;
  ALTER TABLE "component_revisions" ADD CONSTRAINT "component_revisions_definition_id_component_definitions_id_fk" FOREIGN KEY ("definition_id") REFERENCES "public"."component_definitions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_page_compositions_v" ADD CONSTRAINT "_page_compositions_v_parent_id_page_compositions_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."page_compositions"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "component_definitions_key_idx" ON "component_definitions" USING btree ("key");
  CREATE INDEX "component_definitions_updated_at_idx" ON "component_definitions" USING btree ("updated_at");
  CREATE INDEX "component_definitions_created_at_idx" ON "component_definitions" USING btree ("created_at");
  CREATE INDEX "component_revisions_definition_idx" ON "component_revisions" USING btree ("definition_id");
  CREATE INDEX "component_revisions_updated_at_idx" ON "component_revisions" USING btree ("updated_at");
  CREATE INDEX "component_revisions_created_at_idx" ON "component_revisions" USING btree ("created_at");
  CREATE UNIQUE INDEX "page_compositions_slug_idx" ON "page_compositions" USING btree ("slug");
  CREATE INDEX "page_compositions_updated_at_idx" ON "page_compositions" USING btree ("updated_at");
  CREATE INDEX "page_compositions_created_at_idx" ON "page_compositions" USING btree ("created_at");
  CREATE INDEX "page_compositions__status_idx" ON "page_compositions" USING btree ("_status");
  CREATE INDEX "_page_compositions_v_parent_idx" ON "_page_compositions_v" USING btree ("parent_id");
  CREATE INDEX "_page_compositions_v_version_version_slug_idx" ON "_page_compositions_v" USING btree ("version_slug");
  CREATE INDEX "_page_compositions_v_version_version_updated_at_idx" ON "_page_compositions_v" USING btree ("version_updated_at");
  CREATE INDEX "_page_compositions_v_version_version_created_at_idx" ON "_page_compositions_v" USING btree ("version_created_at");
  CREATE INDEX "_page_compositions_v_version_version__status_idx" ON "_page_compositions_v" USING btree ("version__status");
  CREATE INDEX "_page_compositions_v_created_at_idx" ON "_page_compositions_v" USING btree ("created_at");
  CREATE INDEX "_page_compositions_v_updated_at_idx" ON "_page_compositions_v" USING btree ("updated_at");
  CREATE INDEX "_page_compositions_v_latest_idx" ON "_page_compositions_v" USING btree ("latest");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_component_definitions_fk" FOREIGN KEY ("component_definitions_id") REFERENCES "public"."component_definitions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_component_revisions_fk" FOREIGN KEY ("component_revisions_id") REFERENCES "public"."component_revisions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_page_compositions_fk" FOREIGN KEY ("page_compositions_id") REFERENCES "public"."page_compositions"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_component_definitions_id_idx" ON "payload_locked_documents_rels" USING btree ("component_definitions_id");
  CREATE INDEX "payload_locked_documents_rels_component_revisions_id_idx" ON "payload_locked_documents_rels" USING btree ("component_revisions_id");
  CREATE INDEX "payload_locked_documents_rels_page_compositions_id_idx" ON "payload_locked_documents_rels" USING btree ("page_compositions_id");`);
}

export async function down({
  db,
  payload,
  req,
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "component_definitions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "component_revisions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "page_compositions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_page_compositions_v" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "component_definitions" CASCADE;
  DROP TABLE "component_revisions" CASCADE;
  DROP TABLE "page_compositions" CASCADE;
  DROP TABLE "_page_compositions_v" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_component_definitions_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_component_revisions_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_page_compositions_fk";
  
  DROP INDEX "payload_locked_documents_rels_component_definitions_id_idx";
  DROP INDEX "payload_locked_documents_rels_component_revisions_id_idx";
  DROP INDEX "payload_locked_documents_rels_page_compositions_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "component_definitions_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "component_revisions_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "page_compositions_id";
  DROP TYPE "public"."enum_component_revisions_status";
  DROP TYPE "public"."enum_page_compositions_status";
  DROP TYPE "public"."enum__page_compositions_v_version_status";`);
}
