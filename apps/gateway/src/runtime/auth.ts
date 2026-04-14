import { createHash } from "node:crypto";
import "../load-env.js";
import { parseGatewayEnv } from "@repo/config-env/gateway";
import { jwtVerify } from "jose";
import type { Pool } from "pg";

const env = parseGatewayEnv(process.env);

/**
 * Same key material as `payload.secret` / `jwtSign` — Payload hashes config secret (see
 * authentication/jwt.mdx "External JWT validation").
 */
function payloadJwtSigningKey(rawSecret: string): Uint8Array {
  const processed = createHash("sha256")
    .update(rawSecret)
    .digest("hex")
    .slice(0, 32);
  return new TextEncoder().encode(processed);
}

/** Actor attached to gateway requests after session verification (Payload-compatible shape). */
export type GatewayActor = {
  id: number;
  email: string;
  role: string;
  collection?: string;
};

function tokenCookieName(): string {
  return `${env.PAYLOAD_COOKIE_PREFIX}-token`;
}

function getCookieHeader(
  cookieHeader: string | null,
  name: string,
): string | null {
  if (!cookieHeader) {
    return null;
  }
  const parts = cookieHeader.split(";").map((c) => c.trim());
  for (const p of parts) {
    if (p.startsWith(`${name}=`)) {
      return decodeURIComponent(p.slice(name.length + 1));
    }
  }
  return null;
}

/**
 * Extracts the JWT string using the same strategies as Payload local auth (order: JWT / Bearer
 * headers, then `${cookiePrefix}-token`). See Payload `extractJWT` / defaults `auth.jwtOrder`.
 */
function getJwtStringFromRequest(request: Request): string | null {
  const auth = request.headers.get("authorization");
  if (auth) {
    const jwtPrefix = auth.match(/^\s*JWT\s+(.+)$/i);
    if (jwtPrefix?.[1]) {
      return jwtPrefix[1].trim();
    }
    const bearer = auth.match(/^\s*Bearer\s+(.+)$/i);
    if (bearer?.[1]) {
      return bearer[1].trim();
    }
  }
  return getCookieHeader(request.headers.get("cookie"), tokenCookieName());
}

/**
 * Verifies Payload JWT (cookie or Authorization) and loads role from `users` when missing in JWT.
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complexity cleanup backlog.
export async function getActorFromRequest(
  pool: Pool,
  request: Request,
): Promise<GatewayActor | null> {
  const token = getJwtStringFromRequest(request);
  if (!token) {
    return null;
  }
  let sub: string;
  let email = "";
  let role = "";
  try {
    const key = payloadJwtSigningKey(env.PAYLOAD_SECRET);
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"],
    });
    sub =
      typeof payload.sub === "string"
        ? payload.sub
        : typeof payload.id === "number"
          ? String(payload.id)
          : typeof payload.id === "string"
            ? payload.id
            : "";
    if (!sub) {
      return null;
    }
    email = typeof payload.email === "string" ? payload.email : "";
    role =
      typeof payload.role === "string"
        ? payload.role
        : typeof (payload as { role?: unknown }).role === "string"
          ? String((payload as { role: string }).role)
          : "";
  } catch {
    return null;
  }

  let id = Number.parseInt(sub, 10);
  if (!Number.isFinite(id)) {
    const byEmail = await pool.query<{
      id: number;
      email: string;
      role: string;
    }>("select id, email, role from users where email = $1 limit 1", [sub]);
    const row = byEmail.rows[0];
    if (!row) {
      return null;
    }
    id = row.id;
    email = row.email;
    role = row.role;
  } else if (!role || role === "") {
    const r = await pool.query<{ email: string; role: string }>(
      "select email, role from users where id = $1 limit 1",
      [id],
    );
    const row = r.rows[0];
    if (!row) {
      return null;
    }
    email = row.email;
    role = row.role;
  }

  return {
    id,
    email,
    role,
    collection: "users",
  };
}
