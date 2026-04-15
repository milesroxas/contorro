import type { PageComposition } from "@repo/contracts-zod";
import type {
  StudioAuthoringClient,
  StudioAuthoringCompositionPayload,
  StudioDesignSystemSettingsDoc,
  StudioDesignTokenEntry,
  StudioDesignTokenSetDoc,
  StudioPersistCompositionBody,
  StudioRenameResult,
  StudioSaveResult,
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
      const json = (await res.json()) as {
        data: StudioAuthoringCompositionPayload;
      };
      return json.data;
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

    async patchCompositionName(
      compositionId: string,
      name: string,
      options?: { intent?: "draft" | "publish" },
    ): Promise<StudioRenameResult> {
      const intent = options?.intent ?? "draft";
      const res = await fetch(
        joinBase(
          compositionBase,
          `compositions/${encodeURIComponent(compositionId)}`,
        ),
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, intent }),
        },
      );
      if (!res.ok) {
        throw new Error(`rename failed: ${res.status}`);
      }
      const json = (await res.json()) as { data: StudioRenameResult };
      return json.data;
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
        throw new Error(`patch token set failed: ${res.status}`);
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
    let code: string | undefined;
    try {
      const j = (await res.json()) as { error?: { code?: string } };
      code = j.error?.code;
    } catch {
      code = undefined;
    }
    if (res.status === 409 || code === "COMPOSITION_CONFLICT") {
      throw new Error(
        "This template was saved elsewhere. Reload the builder and try again.",
      );
    }
    throw new Error(`save failed: ${res.status}`);
  }
  const json = (await res.json()) as { data: StudioSaveResult };
  return {
    id: json.data.id ?? compositionId,
    updatedAt: json.data.updatedAt,
    ...(json.data._status !== undefined ? { _status: json.data._status } : {}),
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
