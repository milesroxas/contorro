import type { Config } from "payload";

/** Database adapter contract; each app supplies a concrete adapter (architecture spec §4.1 `db.ts`, §9). */
export type DatabaseAdapter = NonNullable<Config["db"]>;

export type DatabaseAdapterFactory = () => DatabaseAdapter;
