import type { MiddlewareHandler } from "hono";

/** Public routes (e.g. `/health`) are registered before authenticated routes. */
export const authMiddleware: MiddlewareHandler = async (_c, next) => {
  await next();
};
