import { gatewayApp } from "@repo/gateway/app";
import { cookies, headers as nextHeaders } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Align with Payload `cookiePrefix` + `-token` (gateway `PAYLOAD_COOKIE_PREFIX`). */
function payloadTokenCookieName(): string {
  const prefix = process.env.PAYLOAD_COOKIE_PREFIX ?? "payload";
  return `${prefix}-token`;
}

function tokenFromCookieHeader(
  cookieHeader: string | null,
  name: string,
): string | undefined {
  if (!cookieHeader) {
    return undefined;
  }
  for (const part of cookieHeader.split(";")) {
    const p = part.trim();
    if (p.startsWith(`${name}=`)) {
      return decodeURIComponent(p.slice(name.length + 1));
    }
  }
  return undefined;
}

/**
 * Payload signs the session JWT into an httpOnly cookie. Some same-origin fetches do not surface
 * that cookie on the Request passed into this handler; `cookies()` still resolves it server-side.
 * Gateway auth accepts `Authorization: JWT …` first (Payload default `auth.jwtOrder`), so we forward
 * the token — see docs/restructure.md §H.5 (same-origin gateway + admin).
 */
async function forwardRequestWithJwt(request: Request): Promise<Request> {
  if (request.headers.get("authorization")) {
    return request;
  }
  const name = payloadTokenCookieName();
  const jar = await cookies();
  let token = jar.get(name)?.value;
  if (!token) {
    token = tokenFromCookieHeader(request.headers.get("cookie"), name);
  }
  if (!token) {
    const incoming = await nextHeaders();
    token = tokenFromCookieHeader(incoming.get("cookie"), name);
  }
  if (!token) {
    return request;
  }
  const headers = new Headers(request.headers);
  headers.set("Authorization", `JWT ${token}`);
  return new Request(request, { headers });
}

async function handle(request: Request): Promise<Response> {
  return gatewayApp.fetch(await forwardRequestWithJwt(request));
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const OPTIONS = handle;
