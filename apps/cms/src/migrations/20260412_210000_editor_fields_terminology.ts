import {
  type MigrateDownArgs,
  type MigrateUpArgs,
  sql,
} from "@payloadcms/db-postgres";

/**
 * Renames Payload fields: CMS-editable “editor fields” vs layout `slotValues` on composition nodes.
 * JSON: `{ slots: [...] }` → `{ editorFields: [...] }` in `editor_fields`.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "component_definitions" RENAME COLUMN "slot_contract" TO "editor_fields";
    ALTER TABLE "component_revisions" RENAME COLUMN "slot_contract" TO "editor_fields";
    ALTER TABLE "pages" RENAME COLUMN "template_slot_values" TO "template_editor_fields";
    ALTER TABLE "_pages_v" RENAME COLUMN "version_template_slot_values" TO "version_template_editor_fields";
    ALTER TABLE "pages_content" RENAME COLUMN "slot_values" TO "editor_field_values";
    ALTER TABLE "_pages_v_version_content" RENAME COLUMN "slot_values" TO "editor_field_values";
  `);

  await db.execute(sql`
    UPDATE "component_definitions"
    SET "editor_fields" = jsonb_build_object('editorFields', "editor_fields"->'slots')
    WHERE "editor_fields" ? 'slots';
  `);
  await db.execute(sql`
    UPDATE "component_revisions"
    SET "editor_fields" = jsonb_build_object('editorFields', "editor_fields"->'slots')
    WHERE "editor_fields" ? 'slots';
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "component_definitions"
    SET "editor_fields" = jsonb_build_object('slots', "editor_fields"->'editorFields')
    WHERE "editor_fields" ? 'editorFields';
  `);
  await db.execute(sql`
    UPDATE "component_revisions"
    SET "editor_fields" = jsonb_build_object('slots', "editor_fields"->'editorFields')
    WHERE "editor_fields" ? 'editorFields';
  `);

  await db.execute(sql`
    ALTER TABLE "component_definitions" RENAME COLUMN "editor_fields" TO "slot_contract";
    ALTER TABLE "component_revisions" RENAME COLUMN "editor_fields" TO "slot_contract";
    ALTER TABLE "pages" RENAME COLUMN "template_editor_fields" TO "template_slot_values";
    ALTER TABLE "_pages_v" RENAME COLUMN "version_template_editor_fields" TO "version_template_slot_values";
    ALTER TABLE "pages_content" RENAME COLUMN "editor_field_values" TO "slot_values";
    ALTER TABLE "_pages_v_version_content" RENAME COLUMN "editor_field_values" TO "slot_values";
  `);
}
