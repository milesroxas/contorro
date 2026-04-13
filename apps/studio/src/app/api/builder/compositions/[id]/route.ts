import { type TokenMeta, compileTokenSet } from "@repo/config-tailwind";
import type { PageComposition } from "@repo/contracts-zod";
import { PageCompositionSchema } from "@repo/contracts-zod";
import { defaultEmptyPageComposition } from "@repo/domains-composition";
import type { Payload } from "payload";
import { getPayload } from "payload";

import { loadPublishedTokenSetForPreview } from "@/lib/load-published-token-set";
import config from "@/payload.config";

async function designTokensForBuilder(payload: Payload): Promise<{
  tokenMetadata: TokenMeta[];
  cssVariables: string;
}> {
  const doc = await loadPublishedTokenSetForPreview(payload);
  if (!doc?.tokens?.length) {
    return { tokenMetadata: [], cssVariables: "" };
  }
  const tokens = doc.tokens.map((t) => ({
    key: t.key,
    category: t.category,
    resolvedValue: t.resolvedValue,
  }));
  const compiled = compileTokenSet({ tokens });
  return {
    tokenMetadata: compiled.tokenMetadata,
    cssVariables: compiled.cssVariables,
  };
}

function normalizeUpdatedAt(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return "";
}

function responseUpdatedAt(value: unknown): string {
  return normalizeUpdatedAt(value) || new Date().toISOString();
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

function isComponentCompositionId(id: string): boolean {
  return id.startsWith("cmp-") && id.length > 4 && id.slice(4).length > 0;
}

export async function GET(
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

  if (isComponentCompositionId(id)) {
    const componentId = id.slice(4);
    const designTokens = await designTokensForBuilder(payload);
    let doc: {
      composition?: unknown;
      updatedAt?: unknown;
    };
    try {
      doc = await payload.findByID({
        collection: "components",
        id: componentId,
        depth: 0,
        draft: true,
        user,
        overrideAccess: false,
      });
    } catch {
      return Response.json(
        { error: { code: "NOT_FOUND" as const } },
        { status: 404 },
      );
    }
    if (!doc) {
      return Response.json(
        { error: { code: "NOT_FOUND" as const } },
        { status: 404 },
      );
    }

    const raw = doc.composition;
    let composition: PageComposition;
    if (raw === undefined || raw === null) {
      composition = defaultEmptyPageComposition();
    } else {
      const parsed = PageCompositionSchema.safeParse(raw);
      if (!parsed.success) {
        return Response.json(
          { error: { code: "VALIDATION_ERROR" as const } },
          { status: 400 },
        );
      }
      composition = parsed.data;
    }

    return Response.json({
      data: {
        composition,
        updatedAt: responseUpdatedAt(doc.updatedAt),
        tokenMetadata: designTokens.tokenMetadata,
        cssVariables: designTokens.cssVariables,
      },
    });
  }

  const designTokens = await designTokensForBuilder(payload);

  let doc: { composition?: unknown; updatedAt?: unknown };
  try {
    doc = await payload.findByID({
      collection: "page-compositions",
      id,
      depth: 0,
      draft: true,
      user,
      overrideAccess: false,
    });
  } catch {
    return Response.json(
      { error: { code: "NOT_FOUND" as const } },
      { status: 404 },
    );
  }
  if (!doc) {
    return Response.json(
      { error: { code: "NOT_FOUND" as const } },
      { status: 404 },
    );
  }

  const raw = doc.composition;
  if (raw === undefined || raw === null) {
    return Response.json(
      { error: { code: "VALIDATION_ERROR" as const } },
      { status: 400 },
    );
  }
  const parsed = PageCompositionSchema.safeParse(raw);
  if (!parsed.success) {
    return Response.json(
      { error: { code: "VALIDATION_ERROR" as const } },
      { status: 400 },
    );
  }

  return Response.json({
    data: {
      composition: parsed.data,
      updatedAt: responseUpdatedAt(doc.updatedAt),
      tokenMetadata: designTokens.tokenMetadata,
      cssVariables: designTokens.cssVariables,
    },
  });
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

  const componentId = isComponentCompositionId(id) ? id.slice(4) : null;

  if (componentId) {
    let existingComponent: { updatedAt?: string };
    try {
      existingComponent = await payload.findByID({
        collection: "components",
        id: componentId,
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
    if (!existingComponent) {
      return Response.json(
        { error: { code: "NOT_FOUND" as const } },
        { status: 404 },
      );
    }

    const currentUpdated = existingComponent.updatedAt;
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
        collection: "components",
        id: componentId,
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
