import { err } from "@repo/kernel";
import type { MiddlewareHandler } from "hono";

import { resultToResponse } from "../lib/result-to-response.js";
import { getActorFromRequest } from "../runtime/auth.js";
import { pool } from "../runtime/db.js";

type AllowedRole = import("../runtime/auth.js").GatewayActor["role"];

declare module "hono" {
  interface ContextVariableMap {
    actor: import("../runtime/auth.js").GatewayActor;
  }
}

export function sessionByRole(allowedRoles: readonly AllowedRole[]) {
  const allowed = new Set<AllowedRole>(allowedRoles);

  const middleware: MiddlewareHandler = async (c, next) => {
    const user = await getActorFromRequest(pool, c.req.raw);
    if (!user) {
      return resultToResponse(c, err("UNAUTHORIZED"));
    }
    if (!allowed.has(user.role)) {
      return resultToResponse(c, err("FORBIDDEN"));
    }
    c.set("actor", user);
    await next();
  };

  return middleware;
}
