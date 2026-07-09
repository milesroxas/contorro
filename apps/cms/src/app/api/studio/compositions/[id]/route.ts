import { compileTokenSet, type TokenMeta } from "@repo/config-tailwind";
import type { PageComposition } from "@repo/contracts-zod";
import {
  blockCatalogEntry,
  PageCompositionSchema,
  STUDIO_CANVAS_MODE_ATTRIBUTE,
} from "@repo/contracts-zod";
import {
  componentIdFromStudioRowId,
  defaultEmptyPageComposition,
  defaultPageTemplateComposition,
  findInvalidStyleTokens,
  isStudioComponentRowId,
  normalizeTemplateShell,
  parseStudioNewCompositionSessionId,
} from "@repo/domains-composition";
import type { Payload } from "payload";
import {
  payloadStudioMutationRepository,
  publicationStatusFromDoc,
} from "@/app/api/studio/_lib/payload-studio-mutation-repository";
import { requireStudioDesigner } from "@/app/api/studio/_lib/studio-auth";
import { loadDesignSystemRuntimeForPreview } from "@/lib/load-published-token-set";
import {
  createCompositionEntryCommand,
  saveCompositionCommand,
  updateCompositionMetaCommand,
} from "@/lib/studio-commands";

async function designTokensForStudio(payload: Payload): Promise<{
  tokenMetadata: TokenMeta[];
  cssVariables: string;
}> {
  const runtime = await loadDesignSystemRuntimeForPreview(payload);
  const doc = runtime.tokenSet;
  if (!doc?.tokens?.length) {
    return { tokenMetadata: [], cssVariables: "" };
  }
  const tokens = doc.tokens.map((t) => {
    const mode: "light" | "dark" = t.mode === "dark" ? "dark" : "light";
    return {
      key: t.key,
      mode,
      category: t.category,
      resolvedValue: t.resolvedValue,
    };
  });
  // Scoped to the studio canvas wrapper so canvas token values follow the explicit
  // canvas color mode, not the editor chrome theme or the host document.
  const compiled = compileTokenSet(
    { tokens },
    {
      rootSelector: `[${STUDIO_CANVAS_MODE_ATTRIBUTE}]`,
      darkSelector: `[${STUDIO_CANVAS_MODE_ATTRIBUTE}="dark"]`,
    },
  );
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

async function getNewSessionComposition(
  payload: Payload,
  id: string,
): Promise<Response | null> {
  const newSession = parseStudioNewCompositionSessionId(id);
  if (!newSession) {
    return null;
  }
  const designTokens = await designTokensForStudio(payload);
  return Response.json({
    data: {
      name:
        newSession.kind === "component"
          ? "Untitled component"
          : "Untitled page template",
      composition:
        newSession.kind === "component"
          ? defaultEmptyPageComposition()
          : defaultPageTemplateComposition(),
      studioResource:
        newSession.kind === "component" ? "component" : "pageTemplate",
      blockType: null,
      updatedAt: "",
      _status: null,
      tokenMetadata: designTokens.tokenMetadata,
      cssVariables: designTokens.cssVariables,
    },
  });
}

async function getComponentComposition(
  payload: Payload,
  user: unknown,
  id: string,
): Promise<Response | null> {
  if (!isStudioComponentRowId(id)) {
    return null;
  }
  const componentId = componentIdFromStudioRowId(id);
  if (!componentId) {
    return Response.json(
      { error: { code: "VALIDATION_ERROR" as const } },
      { status: 400 },
    );
  }
  const designTokens = await designTokensForStudio(payload);
  let doc: {
    composition?: unknown;
    updatedAt?: unknown;
    displayName?: unknown;
    blockType?: unknown;
    _status?: unknown;
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
      name: String(doc.displayName ?? "Untitled component"),
      composition,
      studioResource: "component",
      blockType: typeof doc.blockType === "string" ? doc.blockType : null,
      updatedAt: responseUpdatedAt(doc.updatedAt),
      _status: publicationStatusFromDoc(doc),
      tokenMetadata: designTokens.tokenMetadata,
      cssVariables: designTokens.cssVariables,
    },
  });
}

async function getPageTemplateComposition(
  payload: Payload,
  user: unknown,
  id: string,
): Promise<Response> {
  const designTokens = await designTokensForStudio(payload);

  let doc: {
    composition?: unknown;
    updatedAt?: unknown;
    title?: unknown;
    _status?: unknown;
  };
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
      name: String(doc.title ?? "Untitled page template"),
      composition: normalizeTemplateShell(parsed.data),
      studioResource: "pageTemplate",
      blockType: null,
      updatedAt: responseUpdatedAt(doc.updatedAt),
      _status: publicationStatusFromDoc(doc),
      tokenMetadata: designTokens.tokenMetadata,
      cssVariables: designTokens.cssVariables,
    },
  });
}

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> },
) {
  const { id } = await props.params;
  const auth = await requireStudioDesigner(request);
  if (auth instanceof Response) {
    return auth;
  }
  const { payload, user } = auth;

  const sessionResponse = await getNewSessionComposition(payload, id);
  if (sessionResponse) {
    return sessionResponse;
  }

  const componentResponse = await getComponentComposition(payload, user, id);
  if (componentResponse) {
    return componentResponse;
  }

  return getPageTemplateComposition(payload, user, id);
}

async function createAndSaveNewSessionComposition(
  payload: Payload,
  user: unknown,
  newSession: NonNullable<
    ReturnType<typeof parseStudioNewCompositionSessionId>
  >,
  composition: PageComposition,
  intent: "draft" | "publish",
  nextName: string,
): Promise<Response> {
  const repo = payloadStudioMutationRepository(payload, user);
  const created = await createCompositionEntryCommand(repo, {
    kind: newSession.kind,
    title:
      nextName ||
      (newSession.kind === "component"
        ? "Untitled component"
        : "Untitled page template"),
  });
  if (!created.ok) {
    const status = created.error === "VALIDATION_ERROR" ? 400 : 500;
    return Response.json(
      {
        error: {
          code:
            created.error === "VALIDATION_ERROR"
              ? ("VALIDATION_ERROR" as const)
              : ("CREATE_FAILED" as const),
        },
      },
      { status },
    );
  }

  const saved = await saveCompositionCommand(repo, {
    compositionId: created.value.compositionId,
    composition,
    ifMatchUpdatedAt: null,
    intent,
  });
  if (!saved.ok) {
    if (saved.error === "VALIDATION_ERROR") {
      return Response.json(
        { error: { code: "VALIDATION_ERROR" as const } },
        { status: 400 },
      );
    }
    return Response.json(
      { error: { code: "UPDATE_FAILED" as const } },
      { status: 500 },
    );
  }

  let componentKey: string | undefined;
  if (newSession.kind === "component") {
    const cid = componentIdFromStudioRowId(created.value.compositionId);
    if (cid) {
      try {
        const compDoc = await payload.findByID({
          collection: "components",
          id: cid,
          depth: 0,
          draft: true,
          user,
          overrideAccess: false,
        });
        const k = (compDoc as { key?: unknown } | null)?.key;
        if (typeof k === "string" && k.trim() !== "") {
          componentKey = k.trim();
        }
      } catch {
        // omit componentKey; client may resolve key from listing if needed
      }
    }
  }

  return Response.json({
    data: {
      id: created.value.compositionId,
      updatedAt: saved.value.updatedAt,
      _status: saved.value._status,
      ...(componentKey !== undefined ? { componentKey } : {}),
    },
  });
}

function responseForSaveExisting(
  saved: Awaited<ReturnType<typeof saveCompositionCommand>>,
): Response {
  if (saved.ok) {
    return Response.json({
      data: {
        updatedAt: saved.value.updatedAt,
        _status: saved.value._status,
      },
    });
  }
  if (saved.error === "COMPOSITION_NOT_FOUND") {
    return Response.json(
      { error: { code: "NOT_FOUND" as const } },
      { status: 404 },
    );
  }
  if (saved.error === "COMPOSITION_CONFLICT") {
    return Response.json(
      { error: { code: "COMPOSITION_CONFLICT" as const } },
      { status: 409 },
    );
  }
  if (saved.error === "VALIDATION_ERROR") {
    return Response.json(
      { error: { code: "VALIDATION_ERROR" as const } },
      { status: 400 },
    );
  }
  return Response.json(
    { error: { code: "UPDATE_FAILED" as const } },
    { status: 500 },
  );
}

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> },
) {
  const { id } = await props.params;
  const auth = await requireStudioDesigner(request);
  if (auth instanceof Response) {
    return auth;
  }
  const { payload, user } = auth;

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
    name?: unknown;
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
  const designTokens = await designTokensForStudio(payload);
  const allowedTokenKeys = new Set(
    designTokens.tokenMetadata.map((token) => token.key),
  );
  if (findInvalidStyleTokens(composition, allowedTokenKeys).length > 0) {
    return Response.json(
      { error: { code: "VALIDATION_ERROR" as const } },
      { status: 400 },
    );
  }
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
  const nextName = typeof body.name === "string" ? body.name.trim() : "";

  const newSession = parseStudioNewCompositionSessionId(id);
  if (newSession) {
    return createAndSaveNewSessionComposition(
      payload,
      user,
      newSession,
      composition,
      intent,
      nextName,
    );
  }

  const repo = payloadStudioMutationRepository(payload, user);
  const saved = await saveCompositionCommand(repo, {
    compositionId: id,
    composition,
    ifMatchUpdatedAt,
    intent,
  });
  return responseForSaveExisting(saved);
}

function responseForMetaSuccess(value: {
  name: string;
  updatedAt: string;
  blockType?: string | null;
  _status?: "draft" | "published" | null;
}): Response {
  return Response.json({
    data: {
      name: value.name,
      updatedAt: responseUpdatedAt(value.updatedAt),
      ...(value.blockType !== undefined ? { blockType: value.blockType } : {}),
      ...(value._status != null ? { _status: value._status } : {}),
    },
  });
}

type ParsedMetaPatch = {
  name?: string;
  blockType?: string | null;
  intent: "draft" | "publish";
};

/** `blockType` must be a `BLOCK_CATALOG` slug or `null` (components only). */
function parseMetaPatchBlockType(
  body: { blockType?: unknown },
  compositionId: string,
): { ok: true; blockType?: string | null } | { ok: false; error: string } {
  if (!("blockType" in body)) {
    return { ok: true };
  }
  if (!isStudioComponentRowId(compositionId)) {
    return { ok: false, error: "blockType applies to components only" };
  }
  if (body.blockType === null) {
    return { ok: true, blockType: null };
  }
  if (typeof body.blockType !== "string") {
    return { ok: false, error: "blockType must be a catalog slug or null" };
  }
  if (blockCatalogEntry(body.blockType) === null) {
    return { ok: false, error: `Unknown block type "${body.blockType}"` };
  }
  return { ok: true, blockType: body.blockType };
}

/** PATCH body: `{ name?, blockType?, intent }` — at least one of name/blockType. */
function parseMetaPatchBody(
  raw: unknown,
  compositionId: string,
): ParsedMetaPatch | { error: string } {
  const body =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as { name?: unknown; blockType?: unknown; intent?: unknown })
      : null;
  if (!body) {
    return { error: "Request body must be an object" };
  }
  const name = typeof body.name === "string" ? body.name.trim() : undefined;
  if (name === "") {
    return { error: "Name must not be empty" };
  }

  const blockTypeParsed = parseMetaPatchBlockType(body, compositionId);
  if (!blockTypeParsed.ok) {
    return { error: blockTypeParsed.error };
  }
  const blockType = blockTypeParsed.blockType;

  if (name === undefined && blockType === undefined) {
    return { error: "Provide name and/or blockType" };
  }

  return {
    ...(name !== undefined ? { name } : {}),
    ...(blockType !== undefined ? { blockType } : {}),
    intent: body.intent === "publish" ? "publish" : "draft",
  };
}

export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> },
) {
  const { id } = await props.params;

  const auth = await requireStudioDesigner(request);
  if (auth instanceof Response) {
    return auth;
  }
  const { payload, user } = auth;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return Response.json(
      { error: { code: "INVALID_JSON" as const } },
      { status: 400 },
    );
  }

  const parsed = parseMetaPatchBody(raw, id);
  if ("error" in parsed) {
    return Response.json(
      { error: { code: "VALIDATION_ERROR" as const, message: parsed.error } },
      { status: 400 },
    );
  }
  const { intent, ...patch } = parsed;

  const repo = payloadStudioMutationRepository(payload, user);
  const updated = await updateCompositionMetaCommand(repo, {
    compositionId: id,
    patch,
    intent,
  });
  if (!updated.ok) {
    if (updated.error === "COMPOSITION_NOT_FOUND") {
      return Response.json(
        { error: { code: "NOT_FOUND" as const } },
        { status: 404 },
      );
    }
    if (updated.error === "VALIDATION_ERROR") {
      return Response.json(
        { error: { code: "VALIDATION_ERROR" as const } },
        { status: 400 },
      );
    }
    return Response.json(
      { error: { code: "UPDATE_FAILED" as const } },
      { status: 500 },
    );
  }

  return responseForMetaSuccess(updated.value);
}
