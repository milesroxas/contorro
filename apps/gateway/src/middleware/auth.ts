import type { MiddlewareHandler } from "hono";

/** Same-origin Payload JWT — capability checks land with gateway routes (spec §14.1). */
export const authMiddleware: MiddlewareHandler = async (_c, next) => {
  await next();
};
