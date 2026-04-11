import {
  type MigrateDownArgs,
  type MigrateUpArgs,
  sql,
} from "@payloadcms/db-postgres";

/** Phase 6 — catalog workflow fields, publish jobs, snapshots, activity, soft-lock presence. */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TYPE "public"."enum_component_revisions_status" ADD VALUE 'submitted';
  ALTER TYPE "public"."enum_component_revisions_status" ADD VALUE 'approved';
 `);
  await db.execute(sql`
  ALTER TABLE "component_revisions" ADD COLUMN IF NOT EXISTS "is_breaking_change" boolean DEFAULT false;
  ALTER TABLE "component_revisions" ADD COLUMN IF NOT EXISTS "dependency_impact_acknowledged_at" timestamp(3) with time zone;
 `);
  await db.execute(sql`
  CREATE TYPE "public"."enum_page_compositions_catalog_review_status" AS ENUM('none', 'submitted', 'approved', 'rejected');
  ALTER TABLE "page_compositions" ADD COLUMN "catalog_review_status" "enum_page_compositions_catalog_review_status" DEFAULT 'none' NOT NULL;
  ALTER TABLE "_page_compositions_v" ADD COLUMN "version_catalog_review_status" "enum_page_compositions_catalog_review_status";
 `);
  await db.execute(sql`
  CREATE TYPE "public"."enum_catalog_activity_resource_type" AS ENUM('pageComposition', 'componentRevision', 'componentDefinition', 'page');
  CREATE TYPE "public"."enum_catalog_activity_action" AS ENUM('submit', 'approve', 'reject', 'publish', 'rollback', 'presence');
  CREATE TABLE "catalog_activity" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"resource_type" "enum_catalog_activity_resource_type" NOT NULL,
  	"resource_id" varchar NOT NULL,
  	"action" "enum_catalog_activity_action" NOT NULL,
  	"actor_id" integer,
  	"metadata" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  CREATE TABLE "composition_presence" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"composition_id" integer NOT NULL,
  	"holder_id" integer NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  CREATE TABLE "release_snapshots" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"page_id" integer,
  	"page_composition_id" integer NOT NULL,
  	"snapshot_composition" jsonb NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  CREATE TYPE "public"."enum_publish_jobs_kind" AS ENUM('page_publish', 'component_revision_publish', 'rollback');
  CREATE TYPE "public"."enum_publish_jobs_status" AS ENUM('pending', 'succeeded', 'failed');
  CREATE TABLE "publish_jobs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"idempotency_key" varchar NOT NULL,
  	"kind" "enum_publish_jobs_kind" NOT NULL,
  	"status" "enum_publish_jobs_status" DEFAULT 'pending' NOT NULL,
  	"target_page_id" integer,
  	"target_revision_id" integer,
  	"release_snapshot_id" integer,
  	"error_message" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  ALTER TABLE "catalog_activity" ADD CONSTRAINT "catalog_activity_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "composition_presence" ADD CONSTRAINT "composition_presence_composition_id_page_compositions_id_fk" FOREIGN KEY ("composition_id") REFERENCES "public"."page_compositions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "composition_presence" ADD CONSTRAINT "composition_presence_holder_id_users_id_fk" FOREIGN KEY ("holder_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "release_snapshots" ADD CONSTRAINT "release_snapshots_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "release_snapshots" ADD CONSTRAINT "release_snapshots_page_composition_id_page_compositions_id_fk" FOREIGN KEY ("page_composition_id") REFERENCES "public"."page_compositions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "publish_jobs" ADD CONSTRAINT "publish_jobs_target_page_id_pages_id_fk" FOREIGN KEY ("target_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "publish_jobs" ADD CONSTRAINT "publish_jobs_target_revision_id_component_revisions_id_fk" FOREIGN KEY ("target_revision_id") REFERENCES "public"."component_revisions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "publish_jobs" ADD CONSTRAINT "publish_jobs_release_snapshot_id_release_snapshots_id_fk" FOREIGN KEY ("release_snapshot_id") REFERENCES "public"."release_snapshots"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "catalog_activity_resource_id_idx" ON "catalog_activity" USING btree ("resource_id");
  CREATE INDEX "catalog_activity_created_at_idx" ON "catalog_activity" USING btree ("created_at");
  CREATE INDEX "catalog_activity_updated_at_idx" ON "catalog_activity" USING btree ("updated_at");
  CREATE UNIQUE INDEX "composition_presence_composition_holder_idx" ON "composition_presence" USING btree ("composition_id", "holder_id");
  CREATE INDEX "composition_presence_composition_idx" ON "composition_presence" USING btree ("composition_id");
  CREATE INDEX "composition_presence_updated_at_idx" ON "composition_presence" USING btree ("updated_at");
  CREATE INDEX "release_snapshots_page_idx" ON "release_snapshots" USING btree ("page_id");
  CREATE INDEX "release_snapshots_page_composition_idx" ON "release_snapshots" USING btree ("page_composition_id");
  CREATE INDEX "release_snapshots_created_at_idx" ON "release_snapshots" USING btree ("created_at");
  CREATE UNIQUE INDEX "publish_jobs_idempotency_key_idx" ON "publish_jobs" USING btree ("idempotency_key");
  CREATE INDEX "publish_jobs_created_at_idx" ON "publish_jobs" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "catalog_activity_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "composition_presence_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "release_snapshots_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "publish_jobs_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_catalog_activity_fk" FOREIGN KEY ("catalog_activity_id") REFERENCES "public"."catalog_activity"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_composition_presence_fk" FOREIGN KEY ("composition_presence_id") REFERENCES "public"."composition_presence"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_release_snapshots_fk" FOREIGN KEY ("release_snapshots_id") REFERENCES "public"."release_snapshots"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_publish_jobs_fk" FOREIGN KEY ("publish_jobs_id") REFERENCES "public"."publish_jobs"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_catalog_activity_id_idx" ON "payload_locked_documents_rels" USING btree ("catalog_activity_id");
  CREATE INDEX "payload_locked_documents_rels_composition_presence_id_idx" ON "payload_locked_documents_rels" USING btree ("composition_presence_id");
  CREATE INDEX "payload_locked_documents_rels_release_snapshots_id_idx" ON "payload_locked_documents_rels" USING btree ("release_snapshots_id");
  CREATE INDEX "payload_locked_documents_rels_publish_jobs_id_idx" ON "payload_locked_documents_rels" USING btree ("publish_jobs_id");
 `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_publish_jobs_fk";
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_release_snapshots_fk";
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_composition_presence_fk";
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_catalog_activity_fk";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_publish_jobs_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_release_snapshots_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_composition_presence_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_catalog_activity_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "publish_jobs_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "release_snapshots_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "composition_presence_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "catalog_activity_id";
  DROP TABLE IF EXISTS "publish_jobs" CASCADE;
  DROP TABLE IF EXISTS "release_snapshots" CASCADE;
  DROP TABLE IF EXISTS "composition_presence" CASCADE;
  DROP TABLE IF EXISTS "catalog_activity" CASCADE;
  DROP TYPE IF EXISTS "public"."enum_publish_jobs_status";
  DROP TYPE IF EXISTS "public"."enum_publish_jobs_kind";
  DROP TYPE IF EXISTS "public"."enum_catalog_activity_action";
  DROP TYPE IF EXISTS "public"."enum_catalog_activity_resource_type";
  ALTER TABLE "_page_compositions_v" DROP COLUMN IF EXISTS "version_catalog_review_status";
  ALTER TABLE "page_compositions" DROP COLUMN IF EXISTS "catalog_review_status";
  DROP TYPE IF EXISTS "public"."enum_page_compositions_catalog_review_status";
  ALTER TABLE "component_revisions" DROP COLUMN IF EXISTS "dependency_impact_acknowledged_at";
  ALTER TABLE "component_revisions" DROP COLUMN IF EXISTS "is_breaking_change";
 `);
}
