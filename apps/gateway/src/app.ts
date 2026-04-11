import { ok } from "@repo/kernel";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { getPayloadInstance } from "./payload.js";
import { builderRouter } from "./routes/builder.js";
import { catalogRouter } from "./routes/catalog.js";
import { composerRouter } from "./routes/composer.js";
import { contractsRouter } from "./routes/contracts.js";
import { publishingRouter } from "./routes/publishing.js";

export const gatewayApp = new Hono()
  .basePath("/api/gateway")
  .use(logger())
  .get("/health", async (c) => {
    const payload = await getPayloadInstance();
    await payload.find({ collection: "users", limit: 1 });
    return c.json(ok({ status: "ok" as const, db: "reachable" as const }));
  })
  .route("/builder", builderRouter)
  .route("/composer", composerRouter)
  .route("/catalog", catalogRouter)
  .route("/contracts", contractsRouter)
  .route("/publishing", publishingRouter);
