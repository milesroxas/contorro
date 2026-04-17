import type { PayloadRequest } from "payload";

/**
 * Role from Payload session user — i.e. fields stored in the JWT via `saveToJWT` on the Users
 * collection (`token-data` in Payload docs). Access hooks should use this, not `findByID`, so RBAC
 * stays aligned with the signed token.
 *
 * @see https://payloadcms.com/docs/authentication/token-data
 */
export function roleFromJwtUser(user: unknown): string | undefined {
  if (!user || typeof user !== "object" || !("role" in user)) {
    return undefined;
  }
  const r = (user as { role?: unknown }).role;
  if (typeof r !== "string") {
    return undefined;
  }
  const t = r.trim();
  return t === "" ? undefined : t;
}

/** Convenience for collection/global `access` callbacks. */
export function roleFromRequest(req: PayloadRequest): string | undefined {
  return roleFromJwtUser(req.user);
}
