import { NextResponse } from "next/server";

import { loadFrontendDesignSystemBundle } from "@/lib/load-frontend-design-system-bundle";

/**
 * Published design-system stylesheet for `(frontend)` routes — keeps token CSS out of `<main>`.
 *
 * The frontend layout links this with `?v=<tokenSet.updatedAt>`, so versioned requests are
 * immutable-cacheable; a token-set publish changes `updatedAt` and busts the URL.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const { compiled } = await loadFrontendDesignSystemBundle();
  const version = new URL(request.url).searchParams.get("v");
  return new NextResponse(compiled.cssVariables, {
    headers: {
      "Content-Type": "text/css; charset=utf-8",
      "Cache-Control": version
        ? "public, max-age=31536000, immutable"
        : "private, no-store",
    },
  });
}
