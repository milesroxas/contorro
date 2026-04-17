import type { Field } from "payload";

import { requireStudioDesigner } from "@/app/api/studio/_lib/studio-auth";

/** Loose shape for walking nested Payload field configs (tabs, group, row, etc.). */
type LooseField = {
  type?: unknown;
  name?: unknown;
  label?: unknown;
  fields?: Field[];
  tabs?: Array<{ fields?: Field[] }>;
};

export type StudioPayloadCollectionFieldMeta = {
  name: string;
  label: string;
  /** Coarse kind for filter UI / query operators */
  kind: "text" | "number" | "date" | "checkbox" | "select" | "upload" | "other";
};

function relationshipFieldKind(
  field: Field,
): StudioPayloadCollectionFieldMeta["kind"] {
  const relTo = (field as { relationTo?: string | string[] }).relationTo;
  const targets = Array.isArray(relTo)
    ? relTo
    : typeof relTo === "string"
      ? [relTo]
      : [];
  return targets.includes("media") ? "upload" : "other";
}

function fieldKind(field: Field): StudioPayloadCollectionFieldMeta["kind"] {
  const t = field.type;
  if (
    t === "text" ||
    t === "textarea" ||
    t === "email" ||
    t === "code" ||
    t === "richText"
  ) {
    return "text";
  }
  if (t === "number") {
    return "number";
  }
  if (t === "date") {
    return "date";
  }
  if (t === "checkbox") {
    return "checkbox";
  }
  if (t === "select" || t === "radio") {
    return "select";
  }
  if (t === "upload") {
    return "upload";
  }
  if (t === "relationship") {
    return relationshipFieldKind(field);
  }
  return "other";
}

const CONTAINER_FIELD_TYPES = new Set(["group", "row", "collapsible"]);

function pushHarvestableLeaf(
  raw: Field,
  field: LooseField,
  path: string,
  out: StudioPayloadCollectionFieldMeta[],
): void {
  const kind = fieldKind(raw as Field);
  if (kind === "other") {
    return;
  }
  const labelRaw = typeof field.label === "string" ? field.label : path;
  out.push({
    name: path,
    label: labelRaw.trim() !== "" ? labelRaw : path,
    kind,
  });
}

function harvestOneField(
  raw: Field,
  out: StudioPayloadCollectionFieldMeta[],
  prefix: string,
): void {
  const field = raw as LooseField;
  if (field.type === undefined || field.name === undefined) {
    return;
  }
  const name =
    typeof field.name === "string" && field.name.trim() !== ""
      ? field.name.trim()
      : "";
  if (!name || name === "id") {
    return;
  }
  const path = prefix ? `${prefix}.${name}` : name;

  if (field.type === "tabs" && Array.isArray(field.tabs)) {
    for (const tab of field.tabs) {
      harvestFields(tab.fields, out, prefix);
    }
    return;
  }

  if (
    typeof field.type === "string" &&
    CONTAINER_FIELD_TYPES.has(field.type) &&
    Array.isArray(field.fields)
  ) {
    harvestFields(field.fields, out, path);
    return;
  }

  if (field.type === "array" || field.type === "blocks") {
    return;
  }

  pushHarvestableLeaf(raw, field, path, out);
}

function harvestFields(
  fields: Field[] | undefined,
  out: StudioPayloadCollectionFieldMeta[],
  prefix: string,
): void {
  if (!fields) {
    return;
  }
  for (const raw of fields) {
    if (!raw || typeof raw !== "object") {
      continue;
    }
    harvestOneField(raw, out, prefix);
  }
}

type RouteCtx = { params: Promise<{ slug: string }> };

/**
 * Filterable field metadata for a Payload collection (derived from config).
 */
export async function GET(request: Request, ctx: RouteCtx) {
  const auth = await requireStudioDesigner(request);
  if (auth instanceof Response) {
    return auth;
  }
  const { payload } = auth;

  const { slug: rawSlug } = await ctx.params;
  const slug = decodeURIComponent(rawSlug).trim();
  if (!slug) {
    return Response.json(
      { error: { code: "BAD_REQUEST" as const } },
      {
        status: 400,
      },
    );
  }

  const col = payload.config.collections.find((c) => c.slug === slug);
  if (!col) {
    return Response.json(
      { error: { code: "NOT_FOUND" as const } },
      {
        status: 404,
      },
    );
  }

  const fields: StudioPayloadCollectionFieldMeta[] = [];
  harvestFields(col.fields, fields, "");
  fields.sort((a, b) => a.label.localeCompare(b.label));

  return Response.json({ fields });
}
