import { err } from "@repo/kernel";
import type { MiddlewareHandler } from "hono";

import { resultToResponse } from "../lib/result-to-response.js";
import { getActorFromRequest } from "../runtime/auth.js";
import { pool } from "../runtime/db.js";

declare module "hono" {
  interface ContextVariableMap {
    actor: import("../runtime/auth.js").GatewayActor;
  }
}

/** Contract export/import — §5.2 engineer role plus admin. */
export const engineerSessionMiddleware: MiddlewareHandler = async (c, next) => {
  const user = await getActorFromRequest(pool, c.req.raw);
  if (!user) {
    return resultToResponse(c, err("UNAUTHORIZED"));
  }
  if (user.role !== "admin" && user.role !== "engineer") {
    return resultToResponse(c, err("FORBIDDEN"));
  }
  c.set("actor", user);
  await next();
};
