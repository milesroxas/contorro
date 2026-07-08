import { draftMode } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Exits Next.js draft mode and returns to the page being previewed
 * (referer path when same-origin, `/` otherwise).
 */
export async function GET(request: Request) {
  (await draftMode()).disable();

  let target = "/";
  const referer = request.headers.get("referer");
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      const requestUrl = new URL(request.url);
      if (refererUrl.origin === requestUrl.origin) {
        target = `${refererUrl.pathname}${refererUrl.search}`;
      }
    } catch {
      // malformed referer — fall back to "/"
    }
  }
  redirect(target);
}
