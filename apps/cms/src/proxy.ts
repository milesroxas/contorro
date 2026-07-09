import { type NextRequest, NextResponse } from "next/server";

/** Align with Payload `cookiePrefix` + `-token` (see `api/gateway/[[...route]]/route.ts`). */
function payloadTokenCookieName(): string {
  const prefix = process.env.PAYLOAD_COOKIE_PREFIX ?? "payload";
  return `${prefix}-token`;
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Header auth bypasses Payload's CSRF origin validation, so for state-changing
 * methods the cookie must never be promoted for a request that could have been
 * initiated cross-site. Safe methods carry no CSRF surface (reads only) and are
 * always promoted — top-level navigations send `Sec-Fetch-Site: none|cross-site`
 * and must still authenticate (e.g. following a link into /studio).
 */
function mayPromoteCookie(request: NextRequest): boolean {
  if (SAFE_METHODS.has(request.method.toUpperCase())) {
    return true;
  }
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite) {
    return fetchSite === "same-origin";
  }
  const origin = request.headers.get("origin");
  if (origin) {
    return origin === request.nextUrl.origin;
  }
  // No Origin and no Sec-Fetch-Site: non-browser client (curl, server-side
  // fetch). Those cannot be CSRF'd via ambient cookies.
  return true;
}

/**
 * Payload/Next request handling does not reliably authenticate from the Cookie
 * header alone (`payload.auth({ headers })` misses the session cookie on page
 * requests and some REST calls). Copy the JWT to `Authorization` for `/api/*`
 * and `/studio` requests, gated by {@link mayPromoteCookie}.
 */
export function proxy(request: NextRequest) {
  if (request.headers.get("authorization")) {
    return NextResponse.next();
  }
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/api/") && !pathname.startsWith("/studio")) {
    return NextResponse.next();
  }
  if (!mayPromoteCookie(request)) {
    return NextResponse.next();
  }
  const token = request.cookies.get(payloadTokenCookieName())?.value;
  if (!token) {
    return NextResponse.next();
  }
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("Authorization", `JWT ${token}`);
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/api/:path*", "/studio/:path*", "/studio"],
};
