import type {
  PageComposition,
  StudioAuthoringClient,
  StudioAuthoringCompositionPayload,
  StudioCompositionMetaResult,
  StudioDesignSystemSettingsDoc,
  StudioDesignTokenEntry,
  StudioDesignTokenSetDoc,
  StudioPatchCompositionMetaBody,
  StudioPersistCompositionBody,
  StudioSaveResult,
} from "@repo/contracts-zod";
import {
  StudioAuthoringCompositionPayloadSchema,
  StudioCompositionMetaResultSchema,
  StudioSaveResultSchema,
} from "@repo/contracts-zod";

function joinBase(base: string, path: string): string {
  const b = base.endsWith("/") ? base.slice(0, -1) : base;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

export type FetchStudioAuthoringClientOptions = {
  /**
   * Base path for composition authoring API (GET/POST/PATCH …/compositions/:id).
   * Default `/api/studio` matches Contorro Next routes.
   */
  compositionApiBase?: string;
  /**
   * Base path for generic REST resources (`design-token-sets`, `globals/...`).
   * Default `/api`.
   */
  resourceApiBase?: string;
};

const defaultCompositionApiBase = "/api/studio";
const defaultResourceApiBase = "/api";

export function createFetchStudioAuthoringClient(
  options: FetchStudioAuthoringClientOptions = {},
): StudioAuthoringClient {
  const compositionBase =
    options.compositionApiBase ?? defaultCompositionApiBase;
  const resourceBase = options.resourceApiBase ?? defaultResourceApiBase;

  return {
    async fetchComposition(
      compositionId: string,
    ): Promise<StudioAuthoringCompositionPayload> {
      const res = await fetch(
        joinBase(
          compositionBase,
          `compositions/${encodeURIComponent(compositionId)}`,
        ),
        { credentials: "include" },
      );
      if (!res.ok) {
        throw new Error(`load failed: ${res.status}`);
      }
      const json = (await res.json()) as { data?: unknown };
      const parsed = StudioAuthoringCompositionPayloadSchema.safeParse(
        json.data,
      );
      if (!parsed.success) {
        throw new Error("load failed: unexpected response shape");
      }
      return parsed.data;
    },

    async postDraft(
      compositionId: string,
      body: StudioPersistCompositionBody,
    ): Promise<StudioSaveResult> {
      return postPersist(compositionBase, compositionId, {
        ...body,
        intent: "draft",
      });
    },

    async postPublish(
      compositionId: string,
      body: StudioPersistCompositionBody,
    ): Promise<StudioSaveResult> {
      return postPersist(compositionBase, compositionId, {
        ...body,
        intent: "publish",
      });
    },

    async patchCompositionMeta(
      compositionId: string,
      body: StudioPatchCompositionMetaBody,
    ): Promise<StudioCompositionMetaResult> {
      const res = await fetch(
        joinBase(
          compositionBase,
          `compositions/${encodeURIComponent(compositionId)}`,
        ),
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ intent: body.intent ?? "draft", ...body }),
        },
      );
      if (!res.ok) {
        const failure = await studioRouteFailure(res);
        throw new Error(failure.message ?? `update failed: ${res.status}`);
      }
      const json = (await res.json()) as { data?: unknown };
      const parsed = StudioCompositionMetaResultSchema.safeParse(json.data);
      if (!parsed.success) {
        throw new Error("update failed: unexpected response shape");
      }
      return parsed.data;
    },

    async listDesignTokenSets(
      signal?: AbortSignal,
    ): Promise<StudioDesignTokenSetDoc[]> {
      const res = await fetch(
        joinBase(
          resourceBase,
          "design-token-sets?limit=200&depth=0&sort=-updatedAt",
        ),
        {
          credentials: "include",
          headers: { Accept: "application/json" },
          signal,
        },
      );
      if (!res.ok) {
        throw new Error(`token sets failed: ${res.status}`);
      }
      const json = (await res.json()) as { docs?: StudioDesignTokenSetDoc[] };
      return Array.isArray(json.docs) ? json.docs : [];
    },

    async getDesignSystemSettings(
      signal?: AbortSignal,
    ): Promise<StudioDesignSystemSettingsDoc> {
      const res = await fetch(
        joinBase(resourceBase, "globals/design-system-settings?depth=0"),
        {
          credentials: "include",
          headers: { Accept: "application/json" },
          signal,
        },
      );
      if (!res.ok) {
        throw new Error(`design system settings failed: ${res.status}`);
      }
      return (await res.json()) as StudioDesignSystemSettingsDoc;
    },

    async patchDesignTokenSet(
      id: string,
      body: {
        tokens: StudioDesignTokenEntry[];
        _status: "draft" | "published";
      },
    ): Promise<{ doc?: StudioDesignTokenSetDoc }> {
      const res = await fetch(
        joinBase(resourceBase, `design-token-sets/${encodeURIComponent(id)}`),
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      if (!res.ok) {
        // Payload REST reports hook APIErrors as `{ errors: [{ message }] }` —
        // surface that text (e.g. which published keys are missing) to the editor.
        const message = await payloadErrorMessage(res);
        throw new Error(message ?? `patch token set failed: ${res.status}`);
      }
      return (await res.json()) as { doc?: StudioDesignTokenSetDoc };
    },

    async postDesignSystemSettings(body: {
      defaultTokenSet: number;
      activeBrandKey: string;
      activeColorMode: "light" | "dark";
    }): Promise<void> {
      const res = await fetch(
        joinBase(resourceBase, "globals/design-system-settings"),
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      if (!res.ok) {
        throw new Error(`post design system settings failed: ${res.status}`);
      }
    },
  };
}

async function payloadErrorMessage(res: Response): Promise<string | null> {
  try {
    const json = (await res.json()) as {
      errors?: Array<{ message?: unknown }>;
    };
    const message = json.errors?.[0]?.message;
    return typeof message === "string" && message.trim() !== ""
      ? message
      : null;
  } catch {
    return null;
  }
}

/**
 * Studio route error body: `{ error: { code, message? } }`. `message` carries
 * actionable server detail (invariant text, invalid tokens, publish-gate
 * failures) to render verbatim in the studio error UI.
 */
async function studioRouteFailure(
  res: Response,
): Promise<{ code: string | null; message: string | null }> {
  try {
    const json = (await res.json()) as {
      error?: { code?: unknown; message?: unknown };
    };
    const code = json.error?.code;
    const message = json.error?.message;
    return {
      code: typeof code === "string" ? code : null,
      message:
        typeof message === "string" && message.trim() !== "" ? message : null,
    };
  } catch {
    return { code: null, message: null };
  }
}

async function postPersist(
  compositionBase: string,
  compositionId: string,
  body: {
    composition: PageComposition;
    ifMatchUpdatedAt?: string | null;
    intent: "draft" | "publish";
    name?: string;
  },
): Promise<StudioSaveResult> {
  const res = await fetch(
    joinBase(
      compositionBase,
      `compositions/${encodeURIComponent(compositionId)}`,
    ),
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) {
    const failure = await studioRouteFailure(res);
    if (res.status === 409 || failure.code === "COMPOSITION_CONFLICT") {
      throw new Error(
        "This template was saved elsewhere. Reload the builder and try again.",
      );
    }
    throw new Error(failure.message ?? `save failed: ${res.status}`);
  }
  const json = (await res.json()) as { data?: unknown };
  const parsed = StudioSaveResultSchema.safeParse(json.data);
  if (!parsed.success) {
    throw new Error("save failed: unexpected response shape");
  }
  return {
    ...parsed.data,
    id: parsed.data.id ?? compositionId,
  };
}

let defaultClient: StudioAuthoringClient | null = null;

/** Lazy singleton for hosts that do not inject {@link StudioAuthoringClient}. */
export function getDefaultStudioAuthoringClient(): StudioAuthoringClient {
  if (!defaultClient) {
    defaultClient = createFetchStudioAuthoringClient();
  }
  return defaultClient;
}
