import { type NodePgDatabase, drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

import * as builderSchema from "./schema/builder.js";

const { Pool } = pg;

export type BuilderDb = NodePgDatabase<typeof builderSchema>;

const schema = { ...builderSchema };

export function createBuilderDb(connectionString: string): {
  pool: pg.Pool;
  db: BuilderDb;
} {
  const pool = new Pool({ connectionString });
  const db = drizzle(pool, { schema });
  return { pool, db };
}
