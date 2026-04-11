import type { Result } from "@repo/kernel";
import type { Context } from "hono";

const ERROR_STATUS_MAP: Record<string, number> = {
  COMPOSITION_NOT_FOUND: 404,
  NOT_FOUND: 404,
  INVALID_NODE: 422,
  SLOT_CAPACITY_EXCEEDED: 422,
  VALIDATION_ERROR: 422,
  PERSISTENCE_ERROR: 500,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  COMPOSITION_CONFLICT: 409,
  NOT_IMPLEMENTED: 501,
};

export function resultToResponse<T, E extends string>(
  c: Context,
  result: Result<T, E>,
): Response {
  if (result.ok) {
    return c.json({ data: result.value }, 200);
  }
  const status = ERROR_STATUS_MAP[result.error] ?? 500;
  return new Response(JSON.stringify({ error: { code: result.error } }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
