import type { PageComposition } from "./composition.js";

/** Token metadata returned with a loaded composition (matches runtime compiler output shape). */
export type StudioTokenMeta = {
  key: string;
  cssVar: string;
  category: string;
};

export type StudioAuthoringCompositionPayload = {
  name: string;
  composition: PageComposition;
  updatedAt: string;
  tokenMetadata: StudioTokenMeta[];
  cssVariables: string;
};

export type StudioPersistCompositionBody = {
  composition: PageComposition;
  ifMatchUpdatedAt?: string | null;
  name?: string;
};

export type StudioSaveResult = { id: string; updatedAt: string };

export type StudioRenameResult = { name: string; updatedAt: string };

/** Design token entry in a set (Studio editor; persisted shape is CMS-specific but mapped here). */
export type StudioDesignTokenEntry = {
  id?: string | null;
  key: string;
  mode?: "light" | "dark" | null;
  category: string;
  resolvedValue: string;
};

export type StudioDesignTokenSetDoc = {
  id: number;
  title: string;
  scopeKey: string;
  tokens: StudioDesignTokenEntry[];
  updatedAt?: string;
  _status?: "draft" | "published" | null;
};

export type StudioDesignSystemSettingsDoc = {
  defaultTokenSet?: number | string | null;
  activeColorMode?: "light" | "dark" | null;
};

/**
 * Transport for Studio authoring UIs (`@repo/presentation-studio`). Host apps implement this
 * via HTTP to their routes (e.g. Payload today); swap the server adapter without changing Studio.
 */
export interface StudioAuthoringClient {
  fetchComposition(
    compositionId: string,
  ): Promise<StudioAuthoringCompositionPayload>;

  postDraft(
    compositionId: string,
    body: StudioPersistCompositionBody,
  ): Promise<StudioSaveResult>;

  postPublish(
    compositionId: string,
    body: StudioPersistCompositionBody,
  ): Promise<StudioSaveResult>;

  patchCompositionName(
    compositionId: string,
    name: string,
  ): Promise<StudioRenameResult>;

  listDesignTokenSets(signal?: AbortSignal): Promise<StudioDesignTokenSetDoc[]>;

  getDesignSystemSettings(
    signal?: AbortSignal,
  ): Promise<StudioDesignSystemSettingsDoc>;

  patchDesignTokenSet(
    id: string,
    body: {
      tokens: StudioDesignTokenEntry[];
      _status: "draft" | "published";
    },
  ): Promise<{ doc?: StudioDesignTokenSetDoc }>;

  postDesignSystemSettings(body: {
    defaultTokenSet: number;
    activeBrandKey: string;
    activeColorMode: "light" | "dark";
  }): Promise<void>;
}
