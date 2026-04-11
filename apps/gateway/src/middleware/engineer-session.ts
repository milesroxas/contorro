import { err } from "@repo/kernel";
import type { MiddlewareHandler } from "hono";

import { resultToResponse } from "../lib/result-to-response.js";
import { getPayloadInstance } from "../payload.js";

/** Contract export/import — §5.2 engineer role plus admin. */
export const engineerSessionMiddleware: MiddlewareHandler = async (c, next) => {
  const payload = await getPayloadInstance();
  const { user } = await payload.auth({ headers: c.req.raw.headers });
  if (!user) {
    return resultToResponse(c, err("UNAUTHORIZED"));
  }
  const role = (user as { role?: string }).role;
  if (role !== "admin" && role !== "engineer") {
    return resultToResponse(c, err("FORBIDDEN"));
  }
  c.set("actor", user);
  await next();
};
