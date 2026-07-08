import * as migration_20260708_234028_initial from "./20260708_234028_initial";

export const migrations = [
  {
    up: migration_20260708_234028_initial.up,
    down: migration_20260708_234028_initial.down,
    name: "20260708_234028_initial",
  },
];
