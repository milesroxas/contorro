import { z } from "zod";

import { blockCatalogEntry } from "./block-catalog.js";
import { type PageComposition, PageCompositionSchema } from "./composition.js";

/** Payload drafts publication status as it travels over the wire. */
export const StudioPublicationStatusSchema = z
  .enum(["draft", "published"])
  .nullable();

/** Token metadata returned with a loaded composition (matches runtime compiler output shape). */
export const StudioTokenMetaSchema = z.object({
  key: z.string(),
  cssVar: z.string(),
  category: z.string(),
});

export type StudioTokenMeta = z.infer<typeof StudioTokenMetaSchema>;

/**
 * Canvas wrapper attribute scoping the injected token variables; hosts compile
 * `cssVariables` against it (`[data-studio-canvas-mode]` base / `="dark"` overrides).
 */
export const STUDIO_CANVAS_MODE_ATTRIBUTE = "data-studio-canvas-mode";

/**
 * `GET …/compositions/:id` response `data`:
 * - `studioResource` — which CMS resource this session maps to; prefer over
 *   inferring from `compositionId`.
 * - `blockType` — block type a component design implements (`BLOCK_CATALOG`
 *   slug); `null` = design-only. Always `null` for page templates.
 * - `cssVariables` — token variable layers from the published token set,
 *   pre-scoped to {@link STUDIO_CANVAS_MODE_ATTRIBUTE}.
 */
export const StudioAuthoringCompositionPayloadSchema = z.object({
  name: z.string(),
  composition: PageCompositionSchema,
  updatedAt: z.string(),
  studioResource: z.enum(["pageTemplate", "component"]),
  blockType: z.string().nullable().optional(),
  _status: StudioPublicationStatusSchema.optional(),
  tokenMetadata: z.array(StudioTokenMetaSchema),
  cssVariables: z.string(),
});

export type StudioAuthoringCompositionPayload = z.infer<
  typeof StudioAuthoringCompositionPayloadSchema
>;

/** Client-side save body; the transport adds `intent` (draft vs publish). */
export type StudioPersistCompositionBody = {
  composition: PageComposition;
  ifMatchUpdatedAt?: string | null;
  name?: string;
};

/** `POST …/compositions/:id` request body (save draft / publish). */
export const StudioPersistCompositionRequestSchema = z.object({
  composition: PageCompositionSchema,
  ifMatchUpdatedAt: z.string().nullable().optional(),
  intent: z.enum(["draft", "publish"]),
  name: z.string().optional(),
});

export type StudioPersistCompositionRequest = z.infer<
  typeof StudioPersistCompositionRequestSchema
>;

/** `POST …/compositions/:id` response `data` (`id` omitted for existing docs). */
export const StudioSaveResultSchema = z.object({
  id: z.string().optional(),
  updatedAt: z.string(),
  _status: StudioPublicationStatusSchema.optional(),
  componentKey: z.string().optional(),
});

export type StudioSaveResult = {
  id: string;
  updatedAt: string;
  _status?: "draft" | "published" | null;
  /** Populated when the first save created a new library component. */
  componentKey?: string;
};

/** `POST …/compositions` request body (new studio session). */
export const StudioCreateCompositionRequestSchema = z.object({
  kind: z.enum(["template", "component"]).optional(),
});

/** `POST …/compositions` response `data`. */
export const StudioCreateCompositionResultSchema = z.object({
  id: z.string(),
});

/** Body for `PATCH …/compositions/:id` — at least one of `name`/`blockType`. */
export type StudioPatchCompositionMetaBody = {
  name?: string;
  /** Components only; `null` clears back to design-only. */
  blockType?: string | null;
  intent?: "draft" | "publish";
};

/**
 * `PATCH …/compositions/:id` request body. `blockType` must be a
 * `BLOCK_CATALOG` slug or `null`; the route additionally rejects `blockType`
 * for page compositions (id-dependent, so not expressible here).
 */
export const StudioPatchCompositionMetaRequestSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    blockType: z
      .string()
      .refine((slug) => blockCatalogEntry(slug) !== null, {
        message: "unknown block type",
      })
      .nullable()
      .optional(),
    intent: z.enum(["draft", "publish"]).optional(),
  })
  .refine((body) => body.name !== undefined || body.blockType !== undefined, {
    message: "provide name and/or blockType",
  });

/** `PATCH …/compositions/:id` response `data`. */
export const StudioCompositionMetaResultSchema = z.object({
  name: z.string(),
  updatedAt: z.string(),
  blockType: z.string().nullable().optional(),
  _status: StudioPublicationStatusSchema.optional(),
});

export type StudioCompositionMetaResult = z.infer<
  typeof StudioCompositionMetaResultSchema
>;

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
