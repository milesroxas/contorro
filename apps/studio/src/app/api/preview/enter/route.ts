import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { getPayload } from "payload";

import config from "@/payload.config";

/**
 * Draft preview entry for authenticated compose-pages roles (§13.2, §5.2).
 * Avoids exposing PREVIEW_SECRET to the client; enables Next.js draft mode then redirects to the public slug route.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pageId = searchParams.get("pageId");
  if (!pageId) {
    return new Response("Missing pageId", { status: 400 });
  }

  const payloadConfig = await config;
  const payload = await getPayload({ config: payloadConfig });
  const { user } = await payload.auth({ headers: request.headers });
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const role = (user as { role?: string }).role;
  if (role !== "admin" && role !== "designer" && role !== "contentEditor") {
    return new Response("Forbidden", { status: 403 });
  }

  let doc: unknown;
  try {
    doc = await payload.findByID({
      collection: "pages",
      id: pageId,
      depth: 0,
      draft: true,
      user,
      overrideAccess: false,
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }

  if (
    !doc ||
    typeof doc !== "object" ||
    !("slug" in doc) ||
    typeof (doc as { slug?: unknown }).slug !== "string"
  ) {
    return new Response("Not found", { status: 404 });
  }

  (await draftMode()).enable();
  redirect(`/${(doc as { slug: string }).slug}`);
}
