import {
  createCompositionEntryCommand,
  renameTemplateCommand,
  saveCompositionCommand,
} from "@repo/application-studio";
import { type TokenMeta, compileTokenSet } from "@repo/config-tailwind";
import type { PageComposition } from "@repo/contracts-zod";
import { PageCompositionSchema } from "@repo/contracts-zod";
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
import { getPayload } from "payload";

import { payloadStudioMutationRepository } from "@/app/api/studio/_lib/payload-studio-mutation-repository";
import { loadDesignSystemRuntimeForPreview } from "@/lib/load-published-token-set";
import config from "@/payload.config";

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

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complexity cleanup backlog.
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

  const newSession = parseStudioNewCompositionSessionId(id);
  if (newSession) {
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
        updatedAt: "",
        tokenMetadata: designTokens.tokenMetadata,
        cssVariables: designTokens.cssVariables,
      },
    });
  }

  if (isStudioComponentRowId(id)) {
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
        updatedAt: responseUpdatedAt(doc.updatedAt),
        tokenMetadata: designTokens.tokenMetadata,
        cssVariables: designTokens.cssVariables,
      },
    });
  }

  const designTokens = await designTokensForStudio(payload);

  let doc: { composition?: unknown; updatedAt?: unknown; title?: unknown };
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
      name: String(doc.title ?? "Untitled template"),
      composition: normalizeTemplateShell(parsed.data),
      updatedAt: responseUpdatedAt(doc.updatedAt),
      tokenMetadata: designTokens.tokenMetadata,
      cssVariables: designTokens.cssVariables,
    },
  });
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complexity cleanup backlog.
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
    const repo = payloadStudioMutationRepository(payload, user);
    const created = await createCompositionEntryCommand(repo, {
      kind: newSession.kind,
      title:
        nextName ||
        (newSession.kind === "component"
          ? "Untitled component"
          : "Untitled page template"),
      actor: user,
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
      actor: user,
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

    return Response.json({
      data: {
        id: created.value.compositionId,
        updatedAt: saved.value.updatedAt,
      },
    });
  }

  const repo = payloadStudioMutationRepository(payload, user);
  const saved = await saveCompositionCommand(repo, {
    compositionId: id,
    composition,
    ifMatchUpdatedAt,
    intent,
    actor: user,
  });
  if (!saved.ok) {
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

  return Response.json({
    data: { updatedAt: saved.value.updatedAt },
  });
}

export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> },
) {
  const { id } = await props.params;
  if (isStudioComponentRowId(id)) {
    return Response.json(
      { error: { code: "VALIDATION_ERROR" as const } },
      { status: 400 },
    );
  }

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

  const body =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as { name?: unknown })
      : null;
  const nextName = typeof body?.name === "string" ? body.name.trim() : "";
  if (!nextName) {
    return Response.json(
      { error: { code: "VALIDATION_ERROR" as const } },
      { status: 400 },
    );
  }

  const repo = payloadStudioMutationRepository(payload, user);
  const renamed = await renameTemplateCommand(repo, {
    compositionId: id,
    name: nextName,
    actor: user,
  });
  if (!renamed.ok) {
    if (renamed.error === "COMPOSITION_NOT_FOUND") {
      return Response.json(
        { error: { code: "NOT_FOUND" as const } },
        { status: 404 },
      );
    }
    if (renamed.error === "VALIDATION_ERROR") {
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

  return Response.json({
    data: {
      name: renamed.value.name,
      updatedAt: responseUpdatedAt(renamed.value.updatedAt),
    },
  });
}
