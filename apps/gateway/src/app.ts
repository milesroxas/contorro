import { ok } from "@repo/kernel";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { getPayloadInstance } from "./payload.js";
import { builderRouter } from "./routes/builder.js";

export const gatewayApp = new Hono()
  .basePath("/api/gateway")
  .use(logger())
  .get("/health", async (c) => {
    const payload = await getPayloadInstance();
    await payload.find({ collection: "users", limit: 1 });
    return c.json(ok({ status: "ok" as const, db: "reachable" as const }));
  })
  .route("/builder", builderRouter);
