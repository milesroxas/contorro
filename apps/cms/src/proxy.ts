import { type NextRequest, NextResponse } from "next/server";

/** Align with Payload `cookiePrefix` + `-token` (see `api/gateway/[[...route]]/route.ts`). */
function payloadTokenCookieName(): string {
  const prefix = process.env.PAYLOAD_COOKIE_PREFIX ?? "payload";
  return `${prefix}-token`;
}

/**
 * Payload REST handlers sometimes receive a Request without a usable Cookie header for auth,
 * while the session cookie is still present on the incoming request. The gateway route works
 * around this by copying the JWT to `Authorization`. Mirror that for direct `/api/*` calls
 * (e.g. Studio uploads to `/api/media`).
 */
export function proxy(request: NextRequest) {
  if (request.headers.get("authorization")) {
    return NextResponse.next();
  }
  if (!request.nextUrl.pathname.startsWith("/api/")) {
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
