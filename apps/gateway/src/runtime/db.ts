import "../load-env.js";
import { parseGatewayEnv } from "@repo/config-env/gateway";
import { createStudioDb } from "@repo/infrastructure-persistence";

const env = parseGatewayEnv(process.env);

const created = createStudioDb(env.POSTGRES_URL);

/** Shared Postgres pool (builder Drizzle + raw SQL). */
export const pool = created.pool;

/** Drizzle client for `builder` schema. */
export const builderDb = created.db;
