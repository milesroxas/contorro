import {
  type MigrateDownArgs,
  type MigrateUpArgs,
  sql,
} from "@payloadcms/db-postgres";

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_design_token_sets_tokens_category" AS ENUM('color', 'space', 'size', 'radius', 'typography', 'shadow', 'border', 'zIndex', 'opacity', 'transition', 'breakpoint', 'container');
  CREATE TYPE "public"."enum_design_token_sets_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__design_token_sets_v_version_tokens_category" AS ENUM('color', 'space', 'size', 'radius', 'typography', 'shadow', 'border', 'zIndex', 'opacity', 'transition', 'breakpoint', 'container');
  CREATE TYPE "public"."enum__design_token_sets_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "design_token_sets_tokens" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"category" "enum_design_token_sets_tokens_category",
  	"resolved_value" varchar
  );
  
  CREATE TABLE "design_token_sets" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"scope_key" varchar,
  	"has_been_published" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_design_token_sets_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_design_token_sets_v_version_tokens" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"category" "enum__design_token_sets_v_version_tokens_category",
  	"resolved_value" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_design_token_sets_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_scope_key" varchar,
  	"version_has_been_published" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__design_token_sets_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "design_token_overrides" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"token_set_id" integer NOT NULL,
  	"token_key" varchar NOT NULL,
  	"override" jsonb NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "design_system_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"default_token_set_id" integer,
  	"active_brand_key" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "design_token_sets_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "design_token_overrides_id" integer;
  ALTER TABLE "design_token_sets_tokens" ADD CONSTRAINT "design_token_sets_tokens_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."design_token_sets"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_design_token_sets_v_version_tokens" ADD CONSTRAINT "_design_token_sets_v_version_tokens_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_design_token_sets_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_design_token_sets_v" ADD CONSTRAINT "_design_token_sets_v_parent_id_design_token_sets_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."design_token_sets"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "design_token_overrides" ADD CONSTRAINT "design_token_overrides_token_set_id_design_token_sets_id_fk" FOREIGN KEY ("token_set_id") REFERENCES "public"."design_token_sets"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "design_system_settings" ADD CONSTRAINT "design_system_settings_default_token_set_id_design_token_sets_id_fk" FOREIGN KEY ("default_token_set_id") REFERENCES "public"."design_token_sets"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "design_token_sets_tokens_order_idx" ON "design_token_sets_tokens" USING btree ("_order");
  CREATE INDEX "design_token_sets_tokens_parent_id_idx" ON "design_token_sets_tokens" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "design_token_sets_scope_key_idx" ON "design_token_sets" USING btree ("scope_key");
  CREATE INDEX "design_token_sets_updated_at_idx" ON "design_token_sets" USING btree ("updated_at");
  CREATE INDEX "design_token_sets_created_at_idx" ON "design_token_sets" USING btree ("created_at");
  CREATE INDEX "design_token_sets__status_idx" ON "design_token_sets" USING btree ("_status");
  CREATE INDEX "_design_token_sets_v_version_tokens_order_idx" ON "_design_token_sets_v_version_tokens" USING btree ("_order");
  CREATE INDEX "_design_token_sets_v_version_tokens_parent_id_idx" ON "_design_token_sets_v_version_tokens" USING btree ("_parent_id");
  CREATE INDEX "_design_token_sets_v_parent_idx" ON "_design_token_sets_v" USING btree ("parent_id");
  CREATE INDEX "_design_token_sets_v_version_version_scope_key_idx" ON "_design_token_sets_v" USING btree ("version_scope_key");
  CREATE INDEX "_design_token_sets_v_version_version_updated_at_idx" ON "_design_token_sets_v" USING btree ("version_updated_at");
  CREATE INDEX "_design_token_sets_v_version_version_created_at_idx" ON "_design_token_sets_v" USING btree ("version_created_at");
  CREATE INDEX "_design_token_sets_v_version_version__status_idx" ON "_design_token_sets_v" USING btree ("version__status");
  CREATE INDEX "_design_token_sets_v_created_at_idx" ON "_design_token_sets_v" USING btree ("created_at");
  CREATE INDEX "_design_token_sets_v_updated_at_idx" ON "_design_token_sets_v" USING btree ("updated_at");
  CREATE INDEX "_design_token_sets_v_latest_idx" ON "_design_token_sets_v" USING btree ("latest");
  CREATE INDEX "design_token_overrides_token_set_idx" ON "design_token_overrides" USING btree ("token_set_id");
  CREATE INDEX "design_token_overrides_updated_at_idx" ON "design_token_overrides" USING btree ("updated_at");
  CREATE INDEX "design_token_overrides_created_at_idx" ON "design_token_overrides" USING btree ("created_at");
  CREATE INDEX "design_system_settings_default_token_set_idx" ON "design_system_settings" USING btree ("default_token_set_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_design_token_sets_fk" FOREIGN KEY ("design_token_sets_id") REFERENCES "public"."design_token_sets"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_design_token_overrides_fk" FOREIGN KEY ("design_token_overrides_id") REFERENCES "public"."design_token_overrides"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_design_token_sets_id_idx" ON "payload_locked_documents_rels" USING btree ("design_token_sets_id");
  CREATE INDEX "payload_locked_documents_rels_design_token_overrides_id_idx" ON "payload_locked_documents_rels" USING btree ("design_token_overrides_id");
  `);
}

export async function down({
  db,
  payload,
  req,
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "design_token_sets_tokens" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "design_token_sets" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_design_token_sets_v_version_tokens" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_design_token_sets_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "design_token_overrides" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "design_system_settings" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "design_token_sets_tokens" CASCADE;
  DROP TABLE "design_token_sets" CASCADE;
  DROP TABLE "_design_token_sets_v_version_tokens" CASCADE;
  DROP TABLE "_design_token_sets_v" CASCADE;
  DROP TABLE "design_token_overrides" CASCADE;
  DROP TABLE "design_system_settings" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_design_token_sets_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_design_token_overrides_fk";
  
  DROP INDEX "payload_locked_documents_rels_design_token_sets_id_idx";
  DROP INDEX "payload_locked_documents_rels_design_token_overrides_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "design_token_sets_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "design_token_overrides_id";
  DROP TYPE "public"."enum_design_token_sets_tokens_category";
  DROP TYPE "public"."enum_design_token_sets_status";
  DROP TYPE "public"."enum__design_token_sets_v_version_tokens_category";
  DROP TYPE "public"."enum__design_token_sets_v_version_status";
  `);
}
