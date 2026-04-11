import { err } from "@repo/kernel";
import type { MiddlewareHandler } from "hono";
import type { TypedUser } from "payload";

import { resultToResponse } from "../lib/result-to-response.js";
import { getPayloadInstance } from "../payload.js";

declare module "hono" {
  interface ContextVariableMap {
    actor: TypedUser;
  }
}

/**
 * Page composer / editor surface — §5.2 capability `compose pages`:
 * admin, designer, contentEditor (not engineer; not unauthenticated).
 */
export const composerSessionMiddleware: MiddlewareHandler = async (c, next) => {
  const payload = await getPayloadInstance();
  const { user } = await payload.auth({ headers: c.req.raw.headers });
  if (!user) {
    return resultToResponse(c, err("UNAUTHORIZED"));
  }
  const role = (user as { role?: string }).role;
  if (role !== "admin" && role !== "designer" && role !== "contentEditor") {
    return resultToResponse(c, err("FORBIDDEN"));
  }
  c.set("actor", user);
  await next();
};
