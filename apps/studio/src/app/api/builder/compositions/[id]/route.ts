import { PageCompositionSchema } from "@repo/contracts-zod";
import { getPayload } from "payload";

import config from "@/payload.config";

function normalizeUpdatedAt(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return "";
}

/** Compare client If-Match to Payload `updatedAt` (string or Date). */
function revisionMatches(ifMatch: string, current: unknown): boolean {
  const cur = normalizeUpdatedAt(current);
  if (!cur) {
    return false;
  }
  if (ifMatch === cur) {
    return true;
  }
  const a = Date.parse(ifMatch);
  const b = Date.parse(cur);
  if (!Number.isNaN(a) && !Number.isNaN(b)) {
    return a === b;
  }
  return false;
}

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> },
) {
  const { id } = await props.params;
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

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return Response.json(
      { error: { code: "INVALID_JSON" as const } },
      { status: 400 },
    );
  }

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return Response.json(
      { error: { code: "VALIDATION_ERROR" as const } },
      { status: 400 },
    );
  }
  const body = raw as {
    composition?: unknown;
    ifMatchUpdatedAt?: unknown;
    intent?: unknown;
  };
  const intent = body.intent;
  if (intent !== "draft" && intent !== "publish") {
    return Response.json(
      { error: { code: "VALIDATION_ERROR" as const } },
      { status: 400 },
    );
  }
  const compParsed = PageCompositionSchema.safeParse(body.composition);
  if (!compParsed.success) {
    return Response.json(
      { error: { code: "VALIDATION_ERROR" as const } },
      { status: 400 },
    );
  }
  const composition = compParsed.data;
  const matchRaw = body.ifMatchUpdatedAt;
  if (
    matchRaw !== undefined &&
    matchRaw !== null &&
    typeof matchRaw !== "string"
  ) {
    return Response.json(
      { error: { code: "VALIDATION_ERROR" as const } },
      { status: 400 },
    );
  }
  const ifMatchUpdatedAt = matchRaw as string | null | undefined;

  let existing: { updatedAt?: string };
  try {
    existing = await payload.findByID({
      collection: "page-compositions",
      id,
      depth: 0,
      user,
      overrideAccess: false,
    });
  } catch {
    return Response.json(
      { error: { code: "NOT_FOUND" as const } },
      { status: 404 },
    );
  }
  if (!existing) {
    return Response.json(
      { error: { code: "NOT_FOUND" as const } },
      { status: 404 },
    );
  }

  const currentUpdated = existing.updatedAt;
  if (
    ifMatchUpdatedAt != null &&
    currentUpdated !== undefined &&
    !revisionMatches(ifMatchUpdatedAt, currentUpdated)
  ) {
    return Response.json(
      { error: { code: "COMPOSITION_CONFLICT" as const } },
      { status: 409 },
    );
  }

  try {
    const updated = await payload.update({
      collection: "page-compositions",
      id,
      data:
        intent === "publish"
          ? { composition, _status: "published" as const }
          : { composition },
      draft: intent === "draft",
      user,
      overrideAccess: false,
    });

    return Response.json({
      data: { updatedAt: updated.updatedAt as string },
    });
  } catch {
    return Response.json(
      { error: { code: "UPDATE_FAILED" as const } },
      { status: 500 },
    );
  }
}
