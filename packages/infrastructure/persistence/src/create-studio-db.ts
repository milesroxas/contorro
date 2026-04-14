import { type NodePgDatabase, drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

import * as studioSchema from "./schema/studio.js";

const { Pool } = pg;

export type StudioDb = NodePgDatabase<typeof studioSchema>;

const schema = { ...studioSchema };

export function createStudioDb(connectionString: string): {
  pool: pg.Pool;
  db: StudioDb;
} {
  const pool = new Pool({ connectionString });
  const db = drizzle(pool, { schema });
  return { pool, db };
}
