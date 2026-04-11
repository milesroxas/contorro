import { err } from "@repo/kernel";
import type { MiddlewareHandler } from "hono";
import { resultToResponse } from "../lib/result-to-response.js";
import { getPayloadInstance } from "../payload.js";

/**
 * Publish to live — §5.2: admin and designer only (not contentEditor, not engineer).
 */
export const publisherSessionMiddleware: MiddlewareHandler = async (
  c,
  next,
) => {
  const payload = await getPayloadInstance();
  const { user } = await payload.auth({ headers: c.req.raw.headers });
  if (!user) {
    return resultToResponse(c, err("UNAUTHORIZED"));
  }
  const role = (user as { role?: string }).role;
  if (role !== "admin" && role !== "designer") {
    return resultToResponse(c, err("FORBIDDEN"));
  }
  c.set("actor", user);
  await next();
};
