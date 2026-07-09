import type { PageComposition } from "./composition.js";

/** Token metadata returned with a loaded composition (matches runtime compiler output shape). */
export type StudioTokenMeta = {
  key: string;
  cssVar: string;
  category: string;
};

/**
 * Canvas wrapper attribute scoping the injected token variables; hosts compile
 * `cssVariables` against it (`[data-studio-canvas-mode]` base / `="dark"` overrides).
 */
export const STUDIO_CANVAS_MODE_ATTRIBUTE = "data-studio-canvas-mode";

export type StudioAuthoringCompositionPayload = {
  name: string;
  composition: PageComposition;
  updatedAt: string;
  /** Which CMS resource this session maps to; prefer over inferring from `compositionId`. */
  studioResource: "pageTemplate" | "component";
  /**
   * Block type this component design implements (`BLOCK_CATALOG` slug);
   * `null` = design-only. Always `null` for page templates.
   */
  blockType?: string | null;
  /** Payload drafts: whether the loaded revision is draft or published in CMS. */
  _status?: "draft" | "published" | null;
  tokenMetadata: StudioTokenMeta[];
  /**
   * Token variable layers from the published token set, pre-scoped to
   * {@link STUDIO_CANVAS_MODE_ATTRIBUTE} so the studio injects them verbatim.
   */
  cssVariables: string;
};

export type StudioPersistCompositionBody = {
  composition: PageComposition;
  ifMatchUpdatedAt?: string | null;
  name?: string;
};

export type StudioSaveResult = {
  id: string;
  updatedAt: string;
  _status?: "draft" | "published" | null;
  /** Populated when the first save created a new library component. */
  componentKey?: string;
};

/** Body for `PATCH …/compositions/:id` — at least one of `name`/`blockType`. */
export type StudioPatchCompositionMetaBody = {
  name?: string;
  /** Components only; `null` clears back to design-only. */
  blockType?: string | null;
  intent?: "draft" | "publish";
};

export type StudioCompositionMetaResult = {
  name: string;
  updatedAt: string;
  blockType?: string | null;
  _status?: "draft" | "published" | null;
};

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

  patchCompositionMeta(
    compositionId: string,
    body: StudioPatchCompositionMetaBody,
  ): Promise<StudioCompositionMetaResult>;

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
