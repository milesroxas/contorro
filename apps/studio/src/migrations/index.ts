import * as migration_20260409_205422 from "./20260409_205422";
import * as migration_20260410_212939 from "./20260410_212939";
import * as migration_20260410_220520_phase2_composition_collections from "./20260410_220520_phase2_composition_collections";
import * as migration_20260411_181056_pages_collection from "./20260411_181056_pages_collection";
import * as migration_20260411_182154_phase4_templates_and_catalog from "./20260411_182154_phase4_templates_and_catalog";

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
];
