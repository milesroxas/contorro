import { err } from "@repo/kernel";
import type { MiddlewareHandler } from "hono";
import { Hono } from "hono";

import { resultToResponse } from "../lib/result-to-response.js";

/** Gateway no longer mutates composition state; Payload `/api/builder` is canonical. */
export function createCompositionMutationRouter(middleware: MiddlewareHandler) {
  const r = new Hono();
  r.use(middleware);

  const deprecated = (c: Parameters<MiddlewareHandler>[0]) =>
    resultToResponse(c, err("NOT_IMPLEMENTED"));

  r.all("/compositions/:id", deprecated);
  r.all("/compositions/:id/*", deprecated);

  return r;
}
