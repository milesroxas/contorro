import "../load-env.js";
import { parseGatewayEnv } from "@repo/config-env/gateway";
import pg from "pg";

const env = parseGatewayEnv(process.env);
const { Pool } = pg;

/** Postgres pool for gateway (health, auth lookups, contracts SQL). */
export const pool = new Pool({ connectionString: env.POSTGRES_URL });
