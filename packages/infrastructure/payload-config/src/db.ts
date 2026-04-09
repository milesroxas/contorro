import { postgresAdapter } from "@payloadcms/db-postgres";
import type { Config } from "payload";

/** Database adapter contract; each app supplies a concrete adapter (architecture spec §4.1 `db.ts`, §9). */
export type DatabaseAdapter = NonNullable<Config["db"]>;

export type DatabaseAdapterFactory = () => DatabaseAdapter;

export type CreatePostgresAdapterOptions = {
  connectionString: string;
  /** Per-instance pool cap; use lower values on serverless (spec §9.5). */
  max?: number;
  /** When set, Payload writes migrations here — studio only (spec §9.3). */
  migrationDir?: string;
};

/** Shared Postgres adapter for studio (with migrations) and gateway (without). */
export function createPostgresAdapter(
  opts: CreatePostgresAdapterOptions,
): DatabaseAdapter {
  const max = opts.max ?? (process.env.NODE_ENV === "production" ? 5 : 10);

  return postgresAdapter({
    pool: {
      connectionString: opts.connectionString,
      max,
    },
    push: false,
    ...(opts.migrationDir ? { migrationDir: opts.migrationDir } : {}),
  });
}
