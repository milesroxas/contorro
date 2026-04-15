import { studioRowIdForComponent } from "@repo/domains-composition";
import { getPayload } from "payload";

import config from "@/payload.config";

export type LibraryComponentListItem = {
  key: string;
  displayName: string;
  /** Studio `composition` query value (`cmp-…`) for opening Component studio. */
  studioCompositionId: string;
};

function listItemFromComponentDoc(
  doc: unknown,
): LibraryComponentListItem | null {
  const row = doc as {
    id?: unknown;
    key?: unknown;
    displayName?: unknown;
    composition?: unknown;
  };
  const key = typeof row.key === "string" ? row.key : "";
  if (key === "" || key.startsWith("primitive.")) {
    return null;
  }
  if (row.composition === undefined || row.composition === null) {
    return null;
  }
  const displayName =
    typeof row.displayName === "string" && row.displayName.trim() !== ""
      ? row.displayName
      : key;
  const id = String(row.id ?? "");
  if (id === "") {
    return null;
  }
  return {
    displayName,
    key,
    studioCompositionId: studioRowIdForComponent(id),
  };
}

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
      _status: { equals: "published" },
    },
    user,
    overrideAccess: false,
  });

  const items: LibraryComponentListItem[] = [];
  for (const doc of found.docs) {
    const item = listItemFromComponentDoc(doc);
    if (item) {
      items.push(item);
    }
  }

  return Response.json({ data: { items } });
}
