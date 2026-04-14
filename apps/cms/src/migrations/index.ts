import * as migration_20260409_205422 from "./20260409_205422";
import * as migration_20260410_212939 from "./20260410_212939";
import * as migration_20260410_220520_phase2_composition_collections from "./20260410_220520_phase2_composition_collections";
import * as migration_20260411_181056_pages_collection from "./20260411_181056_pages_collection";
import * as migration_20260411_182154_phase4_templates_and_catalog from "./20260411_182154_phase4_templates_and_catalog";
import * as migration_20260411_193000_page_compositions_catalog_submitted from "./20260411_193000_page_compositions_catalog_submitted";
import * as migration_20260411_210500_phase6_publishing_hardening from "./20260411_210500_phase6_publishing_hardening";
import * as migration_20260412_120000_builder_compositions from "./20260412_120000_builder_compositions";
import * as migration_20260412_140000_phase_d4_designer_bridge from "./20260412_140000_phase_d4_designer_bridge";
import * as migration_20260412_150000_pages_designer_block_tables from "./20260412_150000_pages_designer_block_tables";
import * as migration_20260412_160000_pages_content_array_from_blocks from "./20260412_160000_pages_content_array_from_blocks";
import * as migration_20260412_170000_pages_template_slot_values from "./20260412_170000_pages_template_slot_values";
import * as migration_20260412_180000_backfill_visible_catalog_from_published_revisions from "./20260412_180000_backfill_visible_catalog_from_published_revisions";
import * as migration_20260412_190000_builder_mirror_updated_at_from_page_compositions from "./20260412_190000_builder_mirror_updated_at_from_page_compositions";
import * as migration_20260412_200000_drop_templates_collection from "./20260412_200000_drop_templates_collection";
import * as migration_20260412_210000_editor_fields_terminology from "./20260412_210000_editor_fields_terminology";
import * as migration_20260412_220000_pages_content_layout_slot_id from "./20260412_220000_pages_content_layout_slot_id";
import * as migration_20260412_230000_backfill_builder_from_component_revisions from "./20260412_230000_backfill_builder_from_component_revisions";
import * as migration_20260412_240000_components_collection_payload_folders from "./20260412_240000_components_collection_payload_folders";
import * as migration_20260412_250000_simplify_components_columns from "./20260412_250000_simplify_components_columns";
import * as migration_20260412_260000_pages_content_slots_nested from "./20260412_260000_pages_content_slots_nested";
import * as migration_20260413_140000_design_system_color_modes from "./20260413_140000_design_system_color_modes";
import * as migration_20260414_120000_drop_builder_mirror_schema from "./20260414_120000_drop_builder_mirror_schema";

export const migrations = [
  {
    up: migration_20260409_205422.up,
    down: migration_20260409_205422.down,
    name: "20260409_205422",
  },
  {
    up: migration_20260410_212939.up,
    down: migration_20260410_212939.down,
    name: "20260410_212939",
  },
  {
    up: migration_20260410_220520_phase2_composition_collections.up,
    down: migration_20260410_220520_phase2_composition_collections.down,
    name: "20260410_220520_phase2_composition_collections",
  },
  {
    up: migration_20260411_181056_pages_collection.up,
    down: migration_20260411_181056_pages_collection.down,
    name: "20260411_181056_pages_collection",
  },
  {
    up: migration_20260411_182154_phase4_templates_and_catalog.up,
    down: migration_20260411_182154_phase4_templates_and_catalog.down,
    name: "20260411_182154_phase4_templates_and_catalog",
  },
  {
    up: migration_20260411_193000_page_compositions_catalog_submitted.up,
    down: migration_20260411_193000_page_compositions_catalog_submitted.down,
    name: "20260411_193000_page_compositions_catalog_submitted",
  },
  {
    up: migration_20260411_210500_phase6_publishing_hardening.up,
    down: migration_20260411_210500_phase6_publishing_hardening.down,
    name: "20260411_210500_phase6_publishing_hardening",
  },
  {
    up: migration_20260412_120000_builder_compositions.up,
    down: migration_20260412_120000_builder_compositions.down,
    name: "20260412_120000_builder_compositions",
  },
  {
    up: migration_20260412_140000_phase_d4_designer_bridge.up,
    down: migration_20260412_140000_phase_d4_designer_bridge.down,
    name: "20260412_140000_phase_d4_designer_bridge",
  },
  {
    up: migration_20260412_150000_pages_designer_block_tables.up,
    down: migration_20260412_150000_pages_designer_block_tables.down,
    name: "20260412_150000_pages_designer_block_tables",
  },
  {
    up: migration_20260412_160000_pages_content_array_from_blocks.up,
    down: migration_20260412_160000_pages_content_array_from_blocks.down,
    name: "20260412_160000_pages_content_array_from_blocks",
  },
  {
    up: migration_20260412_170000_pages_template_slot_values.up,
    down: migration_20260412_170000_pages_template_slot_values.down,
    name: "20260412_170000_pages_template_slot_values",
  },
  {
    up: migration_20260412_180000_backfill_visible_catalog_from_published_revisions.up,
    down: migration_20260412_180000_backfill_visible_catalog_from_published_revisions.down,
    name: "20260412_180000_backfill_visible_catalog_from_published_revisions",
  },
  {
    up: migration_20260412_190000_builder_mirror_updated_at_from_page_compositions.up,
    down: migration_20260412_190000_builder_mirror_updated_at_from_page_compositions.down,
    name: "20260412_190000_builder_mirror_updated_at_from_page_compositions",
  },
  {
    up: migration_20260412_200000_drop_templates_collection.up,
    down: migration_20260412_200000_drop_templates_collection.down,
    name: "20260412_200000_drop_templates_collection",
  },
  {
    up: migration_20260412_210000_editor_fields_terminology.up,
    down: migration_20260412_210000_editor_fields_terminology.down,
    name: "20260412_210000_editor_fields_terminology",
  },
  {
    up: migration_20260412_220000_pages_content_layout_slot_id.up,
    down: migration_20260412_220000_pages_content_layout_slot_id.down,
    name: "20260412_220000_pages_content_layout_slot_id",
  },
  {
    up: migration_20260412_230000_backfill_builder_from_component_revisions.up,
    down: migration_20260412_230000_backfill_builder_from_component_revisions.down,
    name: "20260412_230000_backfill_builder_from_component_revisions",
  },
  {
    up: migration_20260412_240000_components_collection_payload_folders.up,
    down: migration_20260412_240000_components_collection_payload_folders.down,
    name: "20260412_240000_components_collection_payload_folders",
  },
  {
    up: migration_20260412_250000_simplify_components_columns.up,
    down: migration_20260412_250000_simplify_components_columns.down,
    name: "20260412_250000_simplify_components_columns",
  },
  {
    up: migration_20260412_260000_pages_content_slots_nested.up,
    down: migration_20260412_260000_pages_content_slots_nested.down,
    name: "20260412_260000_pages_content_slots_nested",
  },
  {
    up: migration_20260413_140000_design_system_color_modes.up,
    down: migration_20260413_140000_design_system_color_modes.down,
    name: "20260413_140000_design_system_color_modes",
  },
  {
    up: migration_20260414_120000_drop_builder_mirror_schema.up,
    down: migration_20260414_120000_drop_builder_mirror_schema.down,
    name: "20260414_120000_drop_builder_mirror_schema",
  },
];
