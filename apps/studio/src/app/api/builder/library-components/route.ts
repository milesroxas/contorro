import { getPayload } from "payload";

import config from "@/payload.config";

export type LibraryComponentListItem = {
  key: string;
  displayName: string;
};

/**
 * Library components available to place on page templates (designer/admin).
 * Excludes built-in `primitive.*` definition rows.
 */
export async function GET(request: Request) {
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

  const found = await payload.find({
    collection: "components",
    depth: 0,
    limit: 500,
    sort: "displayName",
    where: {
      and: [
        { visibleInEditorCatalog: { equals: true } },
        { _status: { equals: "published" } },
      ],
    },
    user,
    overrideAccess: false,
  });

  const items: LibraryComponentListItem[] = [];
  for (const doc of found.docs) {
    const row = doc as {
      key?: unknown;
      displayName?: unknown;
      composition?: unknown;
    };
    const key = typeof row.key === "string" ? row.key : "";
    if (key === "" || key.startsWith("primitive.")) {
      continue;
    }
    if (row.composition === undefined || row.composition === null) {
      continue;
    }
    const displayName =
      typeof row.displayName === "string" && row.displayName.trim() !== ""
        ? row.displayName
        : key;
    items.push({ key, displayName });
  }

  return Response.json({ data: { items } });
}
