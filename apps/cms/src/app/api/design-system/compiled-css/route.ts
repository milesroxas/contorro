import { mergeCompiledDesignSystemCss } from "@repo/config-tailwind";
import { NextResponse } from "next/server";

import { loadFrontendDesignSystemBundle } from "@/lib/load-frontend-design-system-bundle";

/**
 * Published design-system stylesheet for `(frontend)` routes — keeps token CSS out of `<main>`.
 */
export async function GET(): Promise<NextResponse> {
  const { compiled } = await loadFrontendDesignSystemBundle();
  const css = mergeCompiledDesignSystemCss(compiled);
  return new NextResponse(css, {
    headers: {
      "Content-Type": "text/css; charset=utf-8",
      "Cache-Control": "private, no-store",
    },
  });
}
