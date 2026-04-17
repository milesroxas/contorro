import { ok } from "@repo/kernel";
import { Hono } from "hono";
import { logger } from "hono/logger";

import { contractsRouter } from "./routes/contracts.js";
import { pool } from "./runtime/db.js";

export const gatewayApp = new Hono()
  .basePath("/api/gateway")
  .use(logger())
  .get("/health", async (c) => {
    await pool.query("select 1");
    return c.json(ok({ status: "ok" as const, db: "reachable" as const }));
  })
  .route("/contracts", contractsRouter);
