import { ok } from "@repo/kernel";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { authMiddleware } from "./middleware/auth.js";
import { getPayloadInstance } from "./payload.js";

export const gatewayApp = new Hono()
  .basePath("/api/gateway")
  .use(logger())
  .use(authMiddleware)
  .get("/health", async (c) => {
    const payload = await getPayloadInstance();
    await payload.find({ collection: "users", limit: 1 });
    return c.json(ok({ status: "ok" as const, db: "reachable" as const }));
  });
