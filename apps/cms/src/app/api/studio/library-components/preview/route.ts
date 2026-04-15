import type { PageComposition } from "@repo/contracts-zod";
import { PageCompositionSchema } from "@repo/contracts-zod";
import { expandLibraryComponentNodes } from "@repo/domains-composition";
import type { Payload } from "payload";
import { getPayload } from "payload";

import config from "@/payload.config";

async function requireStudioDesigner(
  request: Request,
): Promise<Response | { payload: Payload; user: unknown }> {
  const payloadConfig = await config;
  const payload = await getPayload({ config: payloadConfig });
  const { user } = await payload.auth({ headers: request.headers });
  if (!user) {
    return Response.json(
      { error: { code: "UNAUTHORIZED" as const } },
      { status: 401 },
    );
  }
  const role = (user as { role?: string }).role;
  if (role !== "admin" && role !== "designer") {
    return Response.json(
      { error: { code: "FORBIDDEN" as const } },
      { status: 403 },
    );
  }
  return { payload, user };
}

async function loadComponentComposition(
  payload: Payload,
  user: unknown,
  key: string,
): Promise<PageComposition | null> {
  const found = await payload.find({
    collection: "components",
    where: { key: { equals: key } },
    depth: 0,
    draft: true,
    limit: 1,
    user,
    overrideAccess: false,
  });
  const doc = found.docs[0] as { composition?: unknown } | undefined;
  if (!doc?.composition) {
    return null;
  }
  const parsed = PageCompositionSchema.safeParse(doc.composition);
  return parsed.success ? parsed.data : null;
}

/**
 * Returns the fully expanded composition for a library component `key`
 * (same expansion as the public site) for Studio canvas preview.
 */
export async function GET(request: Request) {
  const auth = await requireStudioDesigner(request);
  if (auth instanceof Response) {
    return auth;
  }
  const { payload, user } = auth;

  const url = new URL(request.url);
  const key = url.searchParams.get("key")?.trim() ?? "";
  if (key === "" || key.startsWith("primitive.")) {
    return Response.json(
      { error: { code: "VALIDATION_ERROR" as const } },
      { status: 400 },
    );
  }

  const base = await loadComponentComposition(payload, user, key);
  if (!base) {
    return Response.json(
      { error: { code: "NOT_FOUND" as const } },
      { status: 404 },
    );
  }

  const expanded = await expandLibraryComponentNodes(base, (nestedKey) =>
    loadComponentComposition(payload, user, nestedKey),
  );

  return Response.json({
    data: {
      composition: expanded,
    },
  });
}
