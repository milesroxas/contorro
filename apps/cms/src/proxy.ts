import { type NextRequest, NextResponse } from "next/server";

/** Align with Payload `cookiePrefix` + `-token` (see `api/gateway/[[...route]]/route.ts`). */
function payloadTokenCookieName(): string {
  const prefix = process.env.PAYLOAD_COOKIE_PREFIX ?? "payload";
  return `${prefix}-token`;
}

/**
 * Header auth bypasses Payload's CSRF origin validation, so the cookie must
 * never be promoted for a request that could have been initiated cross-site.
 */
function isSameOriginRequest(request: NextRequest): boolean {
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
 * Payload REST handlers sometimes receive a Request without a usable Cookie header for auth,
 * while the session cookie is still present on the incoming request. Copy the JWT to
 * `Authorization` for same-origin `/api/*` calls (e.g. Studio uploads to `/api/media`).
 */
export function proxy(request: NextRequest) {
  if (request.headers.get("authorization")) {
    return NextResponse.next();
  }
  if (!request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }
  if (!isSameOriginRequest(request)) {
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
  matcher: "/api/:path*",
};
