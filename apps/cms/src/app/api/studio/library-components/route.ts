import { studioRowIdForComponent } from "@repo/domains-composition";

import { requireStudioDesigner } from "@/app/api/studio/_lib/studio-auth";

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
  if (key === "") {
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
 * Includes `primitive.*` rows that store a composition (e.g. seed primitives).
 */
export async function GET(request: Request) {
  const auth = await requireStudioDesigner(request);
  if (auth instanceof Response) {
    return auth;
  }
  const { payload, user } = auth;

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
