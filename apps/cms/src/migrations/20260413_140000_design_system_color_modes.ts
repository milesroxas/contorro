import {
  type MigrateDownArgs,
  type MigrateUpArgs,
  sql,
} from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'enum_design_token_sets_tokens_mode'
      ) THEN
        CREATE TYPE "public"."enum_design_token_sets_tokens_mode" AS ENUM('light', 'dark');
      END IF;
    END
    $$;

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'enum__design_token_sets_v_version_tokens_mode'
      ) THEN
        CREATE TYPE "public"."enum__design_token_sets_v_version_tokens_mode" AS ENUM('light', 'dark');
      END IF;
    END
    $$;

    ALTER TABLE "design_token_sets_tokens"
      ADD COLUMN IF NOT EXISTS "mode" "enum_design_token_sets_tokens_mode" DEFAULT 'light';

    ALTER TABLE "_design_token_sets_v_version_tokens"
      ADD COLUMN IF NOT EXISTS "mode" "enum__design_token_sets_v_version_tokens_mode" DEFAULT 'light';

    ALTER TABLE "design_system_settings"
      ADD COLUMN IF NOT EXISTS "active_color_mode" varchar DEFAULT 'light';

    UPDATE "design_token_sets_tokens"
      SET "mode" = 'light'
      WHERE "mode" IS NULL;

    UPDATE "_design_token_sets_v_version_tokens"
      SET "mode" = 'light'
      WHERE "mode" IS NULL;

    UPDATE "design_system_settings"
      SET "active_color_mode" = 'light'
      WHERE "active_color_mode" IS NULL OR btrim("active_color_mode") = '';
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "design_token_sets_tokens" DROP COLUMN IF EXISTS "mode";
    ALTER TABLE "_design_token_sets_v_version_tokens" DROP COLUMN IF EXISTS "mode";
    ALTER TABLE "design_system_settings" DROP COLUMN IF EXISTS "active_color_mode";

    DROP TYPE IF EXISTS "public"."enum_design_token_sets_tokens_mode";
    DROP TYPE IF EXISTS "public"."enum__design_token_sets_v_version_tokens_mode";
  `);
}
