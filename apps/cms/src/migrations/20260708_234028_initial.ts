import {
  type MigrateDownArgs,
  type MigrateUpArgs,
  sql,
} from "@payloadcms/db-postgres";

export async function up({
  db,
  payload: _payload,
  req: _req,
}: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_hero_cta_link_type" AS ENUM('url', 'page');
  CREATE TYPE "public"."enum_pages_blocks_cta_button_link_type" AS ENUM('url', 'page');
  CREATE TYPE "public"."enum_pages_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__pages_v_blocks_hero_cta_link_type" AS ENUM('url', 'page');
  CREATE TYPE "public"."enum__pages_v_blocks_cta_button_link_type" AS ENUM('url', 'page');
  CREATE TYPE "public"."enum__pages_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'designer', 'contentEditor', 'engineer');
  CREATE TYPE "public"."enum_design_token_sets_tokens_category" AS ENUM('color', 'space', 'size', 'radius', 'typography', 'shadow', 'border', 'zIndex', 'opacity', 'transition', 'breakpoint', 'container');
  CREATE TYPE "public"."enum_design_token_sets_tokens_mode" AS ENUM('light', 'dark');
  CREATE TYPE "public"."enum_design_token_sets_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__design_token_sets_v_version_tokens_category" AS ENUM('color', 'space', 'size', 'radius', 'typography', 'shadow', 'border', 'zIndex', 'opacity', 'transition', 'breakpoint', 'container');
  CREATE TYPE "public"."enum__design_token_sets_v_version_tokens_mode" AS ENUM('light', 'dark');
  CREATE TYPE "public"."enum__design_token_sets_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_components_block_type" AS ENUM('hero', 'feature', 'cta', 'content');
  CREATE TYPE "public"."enum_components_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__components_v_version_block_type" AS ENUM('hero', 'feature', 'cta', 'content');
  CREATE TYPE "public"."enum__components_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_page_compositions_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__page_compositions_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_payload_folders_folder_type" AS ENUM('components');
  CREATE TYPE "public"."enum_design_system_settings_active_color_mode" AS ENUM('light', 'dark');
  CREATE TABLE "pages_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"design_id" integer,
  	"heading" varchar,
  	"body" jsonb,
  	"image_id" integer,
  	"cta_label" varchar,
  	"cta_link_type" "enum_pages_blocks_hero_cta_link_type" DEFAULT 'url',
  	"cta_url" varchar,
  	"cta_page_id" integer,
  	"cta_open_in_new_tab" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_feature" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"design_id" integer,
  	"heading" varchar,
  	"body" jsonb,
  	"image_id" integer,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_cta" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"design_id" integer,
  	"heading" varchar,
  	"body" jsonb,
  	"button_label" varchar,
  	"button_link_type" "enum_pages_blocks_cta_button_link_type" DEFAULT 'url',
  	"button_url" varchar,
  	"button_page_id" integer,
  	"button_open_in_new_tab" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_content" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"design_id" integer,
  	"body" jsonb,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_content_slots" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"slot_id" varchar
  );
  
  CREATE TABLE "pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"seo_description" jsonb,
  	"social_share_text" jsonb,
  	"page_composition_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_pages_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_pages_v_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"design_id" integer,
  	"heading" varchar,
  	"body" jsonb,
  	"image_id" integer,
  	"cta_label" varchar,
  	"cta_link_type" "enum__pages_v_blocks_hero_cta_link_type" DEFAULT 'url',
  	"cta_url" varchar,
  	"cta_page_id" integer,
  	"cta_open_in_new_tab" boolean DEFAULT false,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_feature" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"design_id" integer,
  	"heading" varchar,
  	"body" jsonb,
  	"image_id" integer,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_cta" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"design_id" integer,
  	"heading" varchar,
  	"body" jsonb,
  	"button_label" varchar,
  	"button_link_type" "enum__pages_v_blocks_cta_button_link_type" DEFAULT 'url',
  	"button_url" varchar,
  	"button_page_id" integer,
  	"button_open_in_new_tab" boolean DEFAULT false,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_content" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"design_id" integer,
  	"body" jsonb,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_version_content_slots" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"slot_id" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_seo_description" jsonb,
  	"version_social_share_text" jsonb,
  	"version_page_composition_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__pages_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"role" "enum_users_role" DEFAULT 'contentEditor' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "design_token_sets_tokens" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"category" "enum_design_token_sets_tokens_category",
  	"mode" "enum_design_token_sets_tokens_mode" DEFAULT 'light',
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
  	"mode" "enum__design_token_sets_v_version_tokens_mode" DEFAULT 'light',
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
  
  CREATE TABLE "components" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"display_name" varchar,
  	"key" varchar,
  	"block_type" "enum_components_block_type",
  	"composition" jsonb,
  	"last_touched_by_id" integer,
  	"folder_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_components_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_components_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_display_name" varchar,
  	"version_key" varchar,
  	"version_block_type" "enum__components_v_version_block_type",
  	"version_composition" jsonb,
  	"version_last_touched_by_id" integer,
  	"version_folder_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__components_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
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
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_folders_folder_type" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_payload_folders_folder_type",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "payload_folders" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"folder_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"pages_id" integer,
  	"users_id" integer,
  	"media_id" integer,
  	"design_token_sets_id" integer,
  	"components_id" integer,
  	"page_compositions_id" integer,
  	"payload_folders_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "design_system_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"default_token_set_id" integer,
  	"active_brand_key" varchar,
  	"active_color_mode" "enum_design_system_settings_active_color_mode" DEFAULT 'light' NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "pages_blocks_hero" ADD CONSTRAINT "pages_blocks_hero_design_id_components_id_fk" FOREIGN KEY ("design_id") REFERENCES "public"."components"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero" ADD CONSTRAINT "pages_blocks_hero_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero" ADD CONSTRAINT "pages_blocks_hero_cta_page_id_pages_id_fk" FOREIGN KEY ("cta_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero" ADD CONSTRAINT "pages_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_feature" ADD CONSTRAINT "pages_blocks_feature_design_id_components_id_fk" FOREIGN KEY ("design_id") REFERENCES "public"."components"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_feature" ADD CONSTRAINT "pages_blocks_feature_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_feature" ADD CONSTRAINT "pages_blocks_feature_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_cta" ADD CONSTRAINT "pages_blocks_cta_design_id_components_id_fk" FOREIGN KEY ("design_id") REFERENCES "public"."components"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_cta" ADD CONSTRAINT "pages_blocks_cta_button_page_id_pages_id_fk" FOREIGN KEY ("button_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_cta" ADD CONSTRAINT "pages_blocks_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_content" ADD CONSTRAINT "pages_blocks_content_design_id_components_id_fk" FOREIGN KEY ("design_id") REFERENCES "public"."components"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_content" ADD CONSTRAINT "pages_blocks_content_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_content_slots" ADD CONSTRAINT "pages_content_slots_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages" ADD CONSTRAINT "pages_page_composition_id_page_compositions_id_fk" FOREIGN KEY ("page_composition_id") REFERENCES "public"."page_compositions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero" ADD CONSTRAINT "_pages_v_blocks_hero_design_id_components_id_fk" FOREIGN KEY ("design_id") REFERENCES "public"."components"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero" ADD CONSTRAINT "_pages_v_blocks_hero_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero" ADD CONSTRAINT "_pages_v_blocks_hero_cta_page_id_pages_id_fk" FOREIGN KEY ("cta_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero" ADD CONSTRAINT "_pages_v_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_feature" ADD CONSTRAINT "_pages_v_blocks_feature_design_id_components_id_fk" FOREIGN KEY ("design_id") REFERENCES "public"."components"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_feature" ADD CONSTRAINT "_pages_v_blocks_feature_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_feature" ADD CONSTRAINT "_pages_v_blocks_feature_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_cta" ADD CONSTRAINT "_pages_v_blocks_cta_design_id_components_id_fk" FOREIGN KEY ("design_id") REFERENCES "public"."components"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_cta" ADD CONSTRAINT "_pages_v_blocks_cta_button_page_id_pages_id_fk" FOREIGN KEY ("button_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_cta" ADD CONSTRAINT "_pages_v_blocks_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_content" ADD CONSTRAINT "_pages_v_blocks_content_design_id_components_id_fk" FOREIGN KEY ("design_id") REFERENCES "public"."components"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_content" ADD CONSTRAINT "_pages_v_blocks_content_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_version_content_slots" ADD CONSTRAINT "_pages_v_version_content_slots_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_parent_id_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_version_page_composition_id_page_compositions_id_fk" FOREIGN KEY ("version_page_composition_id") REFERENCES "public"."page_compositions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "design_token_sets_tokens" ADD CONSTRAINT "design_token_sets_tokens_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."design_token_sets"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_design_token_sets_v_version_tokens" ADD CONSTRAINT "_design_token_sets_v_version_tokens_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_design_token_sets_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_design_token_sets_v" ADD CONSTRAINT "_design_token_sets_v_parent_id_design_token_sets_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."design_token_sets"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "components" ADD CONSTRAINT "components_last_touched_by_id_users_id_fk" FOREIGN KEY ("last_touched_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "components" ADD CONSTRAINT "components_folder_id_payload_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."payload_folders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_components_v" ADD CONSTRAINT "_components_v_parent_id_components_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."components"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_components_v" ADD CONSTRAINT "_components_v_version_last_touched_by_id_users_id_fk" FOREIGN KEY ("version_last_touched_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_components_v" ADD CONSTRAINT "_components_v_version_folder_id_payload_folders_id_fk" FOREIGN KEY ("version_folder_id") REFERENCES "public"."payload_folders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_page_compositions_v" ADD CONSTRAINT "_page_compositions_v_parent_id_page_compositions_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."page_compositions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_folders_folder_type" ADD CONSTRAINT "payload_folders_folder_type_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_folders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_folders" ADD CONSTRAINT "payload_folders_folder_id_payload_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."payload_folders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_design_token_sets_fk" FOREIGN KEY ("design_token_sets_id") REFERENCES "public"."design_token_sets"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_components_fk" FOREIGN KEY ("components_id") REFERENCES "public"."components"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_page_compositions_fk" FOREIGN KEY ("page_compositions_id") REFERENCES "public"."page_compositions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_payload_folders_fk" FOREIGN KEY ("payload_folders_id") REFERENCES "public"."payload_folders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "design_system_settings" ADD CONSTRAINT "design_system_settings_default_token_set_id_design_token_sets_id_fk" FOREIGN KEY ("default_token_set_id") REFERENCES "public"."design_token_sets"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "pages_blocks_hero_order_idx" ON "pages_blocks_hero" USING btree ("_order");
  CREATE INDEX "pages_blocks_hero_parent_id_idx" ON "pages_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_hero_path_idx" ON "pages_blocks_hero" USING btree ("_path");
  CREATE INDEX "pages_blocks_hero_design_idx" ON "pages_blocks_hero" USING btree ("design_id");
  CREATE INDEX "pages_blocks_hero_image_idx" ON "pages_blocks_hero" USING btree ("image_id");
  CREATE INDEX "pages_blocks_hero_cta_cta_page_idx" ON "pages_blocks_hero" USING btree ("cta_page_id");
  CREATE INDEX "pages_blocks_feature_order_idx" ON "pages_blocks_feature" USING btree ("_order");
  CREATE INDEX "pages_blocks_feature_parent_id_idx" ON "pages_blocks_feature" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_feature_path_idx" ON "pages_blocks_feature" USING btree ("_path");
  CREATE INDEX "pages_blocks_feature_design_idx" ON "pages_blocks_feature" USING btree ("design_id");
  CREATE INDEX "pages_blocks_feature_image_idx" ON "pages_blocks_feature" USING btree ("image_id");
  CREATE INDEX "pages_blocks_cta_order_idx" ON "pages_blocks_cta" USING btree ("_order");
  CREATE INDEX "pages_blocks_cta_parent_id_idx" ON "pages_blocks_cta" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_cta_path_idx" ON "pages_blocks_cta" USING btree ("_path");
  CREATE INDEX "pages_blocks_cta_design_idx" ON "pages_blocks_cta" USING btree ("design_id");
  CREATE INDEX "pages_blocks_cta_button_button_page_idx" ON "pages_blocks_cta" USING btree ("button_page_id");
  CREATE INDEX "pages_blocks_content_order_idx" ON "pages_blocks_content" USING btree ("_order");
  CREATE INDEX "pages_blocks_content_parent_id_idx" ON "pages_blocks_content" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_content_path_idx" ON "pages_blocks_content" USING btree ("_path");
  CREATE INDEX "pages_blocks_content_design_idx" ON "pages_blocks_content" USING btree ("design_id");
  CREATE INDEX "pages_content_slots_order_idx" ON "pages_content_slots" USING btree ("_order");
  CREATE INDEX "pages_content_slots_parent_id_idx" ON "pages_content_slots" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "pages_slug_idx" ON "pages" USING btree ("slug");
  CREATE INDEX "pages_page_composition_idx" ON "pages" USING btree ("page_composition_id");
  CREATE INDEX "pages_updated_at_idx" ON "pages" USING btree ("updated_at");
  CREATE INDEX "pages_created_at_idx" ON "pages" USING btree ("created_at");
  CREATE INDEX "pages__status_idx" ON "pages" USING btree ("_status");
  CREATE INDEX "_pages_v_blocks_hero_order_idx" ON "_pages_v_blocks_hero" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_hero_parent_id_idx" ON "_pages_v_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_hero_path_idx" ON "_pages_v_blocks_hero" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_hero_design_idx" ON "_pages_v_blocks_hero" USING btree ("design_id");
  CREATE INDEX "_pages_v_blocks_hero_image_idx" ON "_pages_v_blocks_hero" USING btree ("image_id");
  CREATE INDEX "_pages_v_blocks_hero_cta_cta_page_idx" ON "_pages_v_blocks_hero" USING btree ("cta_page_id");
  CREATE INDEX "_pages_v_blocks_feature_order_idx" ON "_pages_v_blocks_feature" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_feature_parent_id_idx" ON "_pages_v_blocks_feature" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_feature_path_idx" ON "_pages_v_blocks_feature" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_feature_design_idx" ON "_pages_v_blocks_feature" USING btree ("design_id");
  CREATE INDEX "_pages_v_blocks_feature_image_idx" ON "_pages_v_blocks_feature" USING btree ("image_id");
  CREATE INDEX "_pages_v_blocks_cta_order_idx" ON "_pages_v_blocks_cta" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_cta_parent_id_idx" ON "_pages_v_blocks_cta" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_cta_path_idx" ON "_pages_v_blocks_cta" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_cta_design_idx" ON "_pages_v_blocks_cta" USING btree ("design_id");
  CREATE INDEX "_pages_v_blocks_cta_button_button_page_idx" ON "_pages_v_blocks_cta" USING btree ("button_page_id");
  CREATE INDEX "_pages_v_blocks_content_order_idx" ON "_pages_v_blocks_content" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_content_parent_id_idx" ON "_pages_v_blocks_content" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_content_path_idx" ON "_pages_v_blocks_content" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_content_design_idx" ON "_pages_v_blocks_content" USING btree ("design_id");
  CREATE INDEX "_pages_v_version_content_slots_order_idx" ON "_pages_v_version_content_slots" USING btree ("_order");
  CREATE INDEX "_pages_v_version_content_slots_parent_id_idx" ON "_pages_v_version_content_slots" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_parent_idx" ON "_pages_v" USING btree ("parent_id");
  CREATE INDEX "_pages_v_version_version_slug_idx" ON "_pages_v" USING btree ("version_slug");
  CREATE INDEX "_pages_v_version_version_page_composition_idx" ON "_pages_v" USING btree ("version_page_composition_id");
  CREATE INDEX "_pages_v_version_version_updated_at_idx" ON "_pages_v" USING btree ("version_updated_at");
  CREATE INDEX "_pages_v_version_version_created_at_idx" ON "_pages_v" USING btree ("version_created_at");
  CREATE INDEX "_pages_v_version_version__status_idx" ON "_pages_v" USING btree ("version__status");
  CREATE INDEX "_pages_v_created_at_idx" ON "_pages_v" USING btree ("created_at");
  CREATE INDEX "_pages_v_updated_at_idx" ON "_pages_v" USING btree ("updated_at");
  CREATE INDEX "_pages_v_latest_idx" ON "_pages_v" USING btree ("latest");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
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
  CREATE UNIQUE INDEX "components_key_idx" ON "components" USING btree ("key");
  CREATE INDEX "components_block_type_idx" ON "components" USING btree ("block_type");
  CREATE INDEX "components_last_touched_by_idx" ON "components" USING btree ("last_touched_by_id");
  CREATE INDEX "components_folder_idx" ON "components" USING btree ("folder_id");
  CREATE INDEX "components_updated_at_idx" ON "components" USING btree ("updated_at");
  CREATE INDEX "components_created_at_idx" ON "components" USING btree ("created_at");
  CREATE INDEX "components__status_idx" ON "components" USING btree ("_status");
  CREATE INDEX "_components_v_parent_idx" ON "_components_v" USING btree ("parent_id");
  CREATE INDEX "_components_v_version_version_key_idx" ON "_components_v" USING btree ("version_key");
  CREATE INDEX "_components_v_version_version_block_type_idx" ON "_components_v" USING btree ("version_block_type");
  CREATE INDEX "_components_v_version_version_last_touched_by_idx" ON "_components_v" USING btree ("version_last_touched_by_id");
  CREATE INDEX "_components_v_version_version_folder_idx" ON "_components_v" USING btree ("version_folder_id");
  CREATE INDEX "_components_v_version_version_updated_at_idx" ON "_components_v" USING btree ("version_updated_at");
  CREATE INDEX "_components_v_version_version_created_at_idx" ON "_components_v" USING btree ("version_created_at");
  CREATE INDEX "_components_v_version_version__status_idx" ON "_components_v" USING btree ("version__status");
  CREATE INDEX "_components_v_created_at_idx" ON "_components_v" USING btree ("created_at");
  CREATE INDEX "_components_v_updated_at_idx" ON "_components_v" USING btree ("updated_at");
  CREATE INDEX "_components_v_latest_idx" ON "_components_v" USING btree ("latest");
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
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_folders_folder_type_order_idx" ON "payload_folders_folder_type" USING btree ("order");
  CREATE INDEX "payload_folders_folder_type_parent_idx" ON "payload_folders_folder_type" USING btree ("parent_id");
  CREATE INDEX "payload_folders_name_idx" ON "payload_folders" USING btree ("name");
  CREATE INDEX "payload_folders_folder_idx" ON "payload_folders" USING btree ("folder_id");
  CREATE INDEX "payload_folders_updated_at_idx" ON "payload_folders" USING btree ("updated_at");
  CREATE INDEX "payload_folders_created_at_idx" ON "payload_folders" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("pages_id");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_design_token_sets_id_idx" ON "payload_locked_documents_rels" USING btree ("design_token_sets_id");
  CREATE INDEX "payload_locked_documents_rels_components_id_idx" ON "payload_locked_documents_rels" USING btree ("components_id");
  CREATE INDEX "payload_locked_documents_rels_page_compositions_id_idx" ON "payload_locked_documents_rels" USING btree ("page_compositions_id");
  CREATE INDEX "payload_locked_documents_rels_payload_folders_id_idx" ON "payload_locked_documents_rels" USING btree ("payload_folders_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "design_system_settings_default_token_set_idx" ON "design_system_settings" USING btree ("default_token_set_id");`);
}

export async function down({
  db,
  payload: _payload,
  req: _req,
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_hero" CASCADE;
  DROP TABLE "pages_blocks_feature" CASCADE;
  DROP TABLE "pages_blocks_cta" CASCADE;
  DROP TABLE "pages_blocks_content" CASCADE;
  DROP TABLE "pages_content_slots" CASCADE;
  DROP TABLE "pages" CASCADE;
  DROP TABLE "_pages_v_blocks_hero" CASCADE;
  DROP TABLE "_pages_v_blocks_feature" CASCADE;
  DROP TABLE "_pages_v_blocks_cta" CASCADE;
  DROP TABLE "_pages_v_blocks_content" CASCADE;
  DROP TABLE "_pages_v_version_content_slots" CASCADE;
  DROP TABLE "_pages_v" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "design_token_sets_tokens" CASCADE;
  DROP TABLE "design_token_sets" CASCADE;
  DROP TABLE "_design_token_sets_v_version_tokens" CASCADE;
  DROP TABLE "_design_token_sets_v" CASCADE;
  DROP TABLE "components" CASCADE;
  DROP TABLE "_components_v" CASCADE;
  DROP TABLE "page_compositions" CASCADE;
  DROP TABLE "_page_compositions_v" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_folders_folder_type" CASCADE;
  DROP TABLE "payload_folders" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "design_system_settings" CASCADE;
  DROP TYPE "public"."enum_pages_blocks_hero_cta_link_type";
  DROP TYPE "public"."enum_pages_blocks_cta_button_link_type";
  DROP TYPE "public"."enum_pages_status";
  DROP TYPE "public"."enum__pages_v_blocks_hero_cta_link_type";
  DROP TYPE "public"."enum__pages_v_blocks_cta_button_link_type";
  DROP TYPE "public"."enum__pages_v_version_status";
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum_design_token_sets_tokens_category";
  DROP TYPE "public"."enum_design_token_sets_tokens_mode";
  DROP TYPE "public"."enum_design_token_sets_status";
  DROP TYPE "public"."enum__design_token_sets_v_version_tokens_category";
  DROP TYPE "public"."enum__design_token_sets_v_version_tokens_mode";
  DROP TYPE "public"."enum__design_token_sets_v_version_status";
  DROP TYPE "public"."enum_components_block_type";
  DROP TYPE "public"."enum_components_status";
  DROP TYPE "public"."enum__components_v_version_block_type";
  DROP TYPE "public"."enum__components_v_version_status";
  DROP TYPE "public"."enum_page_compositions_status";
  DROP TYPE "public"."enum__page_compositions_v_version_status";
  DROP TYPE "public"."enum_payload_folders_folder_type";
  DROP TYPE "public"."enum_design_system_settings_active_color_mode";`);
}
