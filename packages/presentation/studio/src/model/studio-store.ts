import type { TokenMeta } from "@repo/config-tailwind";
import type {
  EditorFieldSpec,
  PageComposition,
  StudioAuthoringClient,
  StyleProperty,
  StylePropertyEntry,
} from "@repo/contracts-zod";
import {
  addChildNode,
  clearNodeStyleBinding,
  isStudioComponentRowId,
  isStudioNewCompositionSessionId,
  moveNode as moveNodeInComposition,
  parseStudioNewCompositionSessionId,
  removeSubtree,
  resetNodePropKeyToPrimitiveDefault,
  setNodeContentBinding,
  setNodeStyleProperty,
  updateNodePropValues,
} from "@repo/domains-composition";
import { createSafeStore } from "@repo/presentation-shared";

import { getDefaultStudioAuthoringClient } from "../lib/fetch-studio-authoring-client.js";
import { prepareForSave } from "../lib/persist.js";

/**
 * Nested primitives (links, etc.) or text ranges can retain browser focus/selection
 * after `selectedNodeId` moves to an ancestor — clear those so canvas chrome matches
 * the store (single source of truth for which node is active).
 */
function clearCanvasPreviewDomUiState(): void {
  if (typeof document === "undefined") {
    return;
  }
  const preview = document.querySelector(
    '[data-testid="studio-canvas-preview"]',
  );
  if (!(preview instanceof HTMLElement)) {
    return;
  }
  const active = document.activeElement;
  if (active instanceof HTMLElement) {
    const inFormField =
      active instanceof HTMLInputElement ||
      active instanceof HTMLTextAreaElement ||
      active instanceof HTMLSelectElement ||
      active.isContentEditable;
    if (preview.contains(active) && !inFormField) {
      active.blur();
    }
  }
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) {
    return;
  }
  const anchor = sel.anchorNode;
  const anchorEl =
    anchor instanceof Element ? anchor : (anchor?.parentElement ?? null);
  if (anchorEl && preview.contains(anchorEl)) {
    sel.removeAllRanges();
  }
}

export type StudioStoreState = {
  compositionId: string;
  composition: PageComposition | null;
  name: string;
  historyPast: PageComposition[];
  historyFuture: PageComposition[];
  tokenMetadata: TokenMeta[];
  cssVariables: string;
  tokenUtilityCss: string;
  updatedAt: string | null;
  /** Payload CMS publication state for the loaded composition revision. */
  cmsPublicationStatus: "draft" | "published" | null;
  selectedNodeId: string | null;
  dirty: boolean;
  saving: boolean;
  renaming: boolean;
  error: string | null;
  canUndo: boolean;
  canRedo: boolean;
  /** Authoritative template vs component; from API (or inferred from id when absent). */
  studioResource: "pageTemplate" | "component" | null;
  load: () => Promise<void>;
  cancel: () => void;
  undo: () => void;
  redo: () => void;
  selectNode: (id: string | null) => void;
  addPrimitive: (
    parentId: string,
    definitionKey: string,
    insertIndex?: number,
    libraryComponentKey?: string,
  ) => void;
  moveNode: (nodeId: string, targetParentId: string, index: number) => void;
  removeNode: (nodeId: string) => void;
  setTextContent: (nodeId: string, content: string) => void;
  patchNodeProps: (nodeId: string, patch: Record<string, unknown>) => void;
  setNodeStyleEntry: (
    nodeId: string,
    property: StyleProperty,
    entry: StylePropertyEntry | null,
  ) => void;
  resetNodePropKey: (nodeId: string, propKey: string) => void;
  clearNodeStyles: (nodeId: string) => void;
  setNodeEditorFieldBinding: (
    nodeId: string,
    field: EditorFieldSpec | null,
  ) => void;
  setNodeCollectionFieldBinding: (
    nodeId: string,
    fieldPath: string | null,
  ) => void;
  saveDraft: () => Promise<void>;
  publish: () => Promise<void>;
  rename: (name: string) => Promise<void>;
};

function inferStudioResourceFromId(
  compositionId: string,
): "pageTemplate" | "component" {
  if (isStudioComponentRowId(compositionId)) {
    return "component";
  }
  const session = parseStudioNewCompositionSessionId(compositionId);
  if (session?.kind === "component") {
    return "component";
  }
  return "pageTemplate";
}

function replaceCompositionIdInUrl(savedId: string, previousId: string): void {
  if (savedId === previousId || typeof window === "undefined") {
    return;
  }
  const url = new URL(window.location.href);
  url.searchParams.set("composition", savedId);
  window.history.replaceState({}, "", url.toString());
}

async function saveOrPublishComposition(args: {
  get: () => StudioStoreState;
  set: (
    partial:
      | Partial<StudioStoreState>
      | ((state: StudioStoreState) => Partial<StudioStoreState>),
  ) => void;
  client: StudioAuthoringClient;
  mode: "draft" | "publish";
}): Promise<void> {
  const { get, set, client, mode } = args;
  const { composition, updatedAt, compositionId: id, saving } = get();
  if (!composition || saving) {
    return;
  }
  const prep = prepareForSave(composition);
  if (!prep.ok) {
    set({ error: "Invalid composition" });
    return;
  }
  set({ error: null, saving: true });
  try {
    const payload = {
      composition: prep.data,
      ifMatchUpdatedAt: isStudioNewCompositionSessionId(id) ? null : updatedAt,
      name: get().name,
    };
    const saved =
      mode === "draft"
        ? await client.postDraft(id, payload)
        : await client.postPublish(id, payload);
    set({
      compositionId: saved.id,
      updatedAt: saved.updatedAt,
      dirty: false,
      cmsPublicationStatus:
        saved._status !== undefined
          ? saved._status
          : get().cmsPublicationStatus,
    });
    replaceCompositionIdInUrl(saved.id, id);
  } catch (e) {
    const fallback = mode === "draft" ? "save failed" : "publish failed";
    set({
      error: e instanceof Error ? e.message : fallback,
    });
  } finally {
    set({ saving: false });
  }
}

async function applyCompositionRename(args: {
  get: () => StudioStoreState;
  set: (
    partial:
      | Partial<StudioStoreState>
      | ((state: StudioStoreState) => Partial<StudioStoreState>),
  ) => void;
  client: StudioAuthoringClient;
  nextName: string;
}): Promise<void> {
  const { get, set, client } = args;
  const trimmed = args.nextName.trim();
  const { compositionId: id, renaming, name } = get();
  if (!trimmed || renaming || trimmed === name) {
    return;
  }
  if (isStudioNewCompositionSessionId(id)) {
    set({ name: trimmed });
    return;
  }
  set({ error: null, renaming: true });
  try {
    const data = await client.patchCompositionName(id, trimmed);
    const cmsPublicationStatus =
      data._status !== undefined ? data._status : get().cmsPublicationStatus;
    set({
      name: data.name,
      updatedAt: data.updatedAt,
      cmsPublicationStatus,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "rename failed";
    set({ error: message });
  } finally {
    set({ renaming: false });
  }
}

export function createStudioStore(
  compositionId: string,
  options?: { client?: StudioAuthoringClient },
) {
  const client = options?.client ?? getDefaultStudioAuthoringClient();

  return createSafeStore<StudioStoreState>((set, get) => ({
    compositionId,
    composition: null,
    name: "",
    historyPast: [],
    historyFuture: [],
    tokenMetadata: [],
    cssVariables: "",
    tokenUtilityCss: "",
    updatedAt: null,
    cmsPublicationStatus: null,
    selectedNodeId: null,
    dirty: false,
    saving: false,
    renaming: false,
    error: null,
    canUndo: false,
    canRedo: false,
    studioResource: null,

    cancel: () => {
      void get().load();
    },

    undo: () => {
      const { composition, historyPast, historyFuture } = get();
      if (!composition || historyPast.length === 0) {
        return;
      }
      const previous = historyPast[historyPast.length - 1];
      const nextPast = historyPast.slice(0, -1);
      const nextFuture = [composition, ...historyFuture];
      set({
        composition: previous,
        historyPast: nextPast,
        historyFuture: nextFuture,
        dirty: true,
        canUndo: nextPast.length > 0,
        canRedo: nextFuture.length > 0,
      });
    },

    redo: () => {
      const { composition, historyPast, historyFuture } = get();
      if (!composition || historyFuture.length === 0) {
        return;
      }
      const next = historyFuture[0];
      const nextFuture = historyFuture.slice(1);
      const nextPast = [...historyPast, composition];
      set({
        composition: next,
        historyPast: nextPast,
        historyFuture: nextFuture,
        dirty: true,
        canUndo: nextPast.length > 0,
        canRedo: nextFuture.length > 0,
      });
    },

    load: async () => {
      set({ error: null });
      try {
        const isNewSession = isStudioNewCompositionSessionId(
          get().compositionId,
        );
        const data = await client.fetchComposition(get().compositionId);
        set({
          composition: data.composition,
          name: data.name,
          studioResource:
            data.studioResource ??
            inferStudioResourceFromId(get().compositionId),
          historyPast: [],
          historyFuture: [],
          tokenMetadata: data.tokenMetadata as TokenMeta[],
          cssVariables: data.cssVariables,
          tokenUtilityCss: data.tokenUtilityCss ?? "",
          updatedAt: data.updatedAt,
          cmsPublicationStatus: data._status ?? null,
          // New sessions are not persisted yet; keep save actions enabled.
          dirty: isNewSession,
          canUndo: false,
          canRedo: false,
          selectedNodeId: data.composition.rootId,
        });
      } catch (e) {
        set({
          error: e instanceof Error ? e.message : "load failed",
        });
      }
    },

    selectNode: (id) => {
      const previousId = get().selectedNodeId;
      if (id !== previousId) {
        clearCanvasPreviewDomUiState();
      }
      set({ selectedNodeId: id });
    },

    addPrimitive: (
      parentId,
      definitionKey,
      insertIndex,
      libraryComponentKey,
    ) => {
      const { composition } = get();
      if (!composition) {
        return;
      }
      const before = new Set(Object.keys(composition.nodes));
      const next = addChildNode(
        composition,
        parentId,
        definitionKey,
        insertIndex,
        libraryComponentKey !== undefined ? { libraryComponentKey } : undefined,
      );
      if (!next.ok) {
        return;
      }
      const addedId = Object.keys(next.value.nodes).find((k) => !before.has(k));
      const prev = composition;
      set({
        composition: next.value,
        historyPast: [...get().historyPast, prev],
        historyFuture: [],
        dirty: true,
        canUndo: true,
        canRedo: false,
        selectedNodeId: addedId ?? get().selectedNodeId,
      });
    },

    moveNode: (nodeId, targetParentId, index) => {
      const { composition } = get();
      if (!composition) {
        return;
      }
      const next = moveNodeInComposition(
        composition,
        nodeId,
        targetParentId,
        index,
      );
      if (!next.ok) {
        return;
      }
      set({
        composition: next.value,
        historyPast: [...get().historyPast, composition],
        historyFuture: [],
        dirty: true,
        canUndo: true,
        canRedo: false,
      });
    },

    removeNode: (nodeId) => {
      const { composition, selectedNodeId } = get();
      if (!composition) {
        return;
      }
      const parentId = composition.nodes[nodeId]?.parentId;
      const next = removeSubtree(composition, nodeId);
      if (!next.ok) {
        return;
      }
      let nextSelected = selectedNodeId;
      if (selectedNodeId && !next.value.nodes[selectedNodeId]) {
        nextSelected = parentId ?? composition.rootId;
      }
      set({
        composition: next.value,
        historyPast: [...get().historyPast, composition],
        historyFuture: [],
        dirty: true,
        canUndo: true,
        canRedo: false,
        selectedNodeId: nextSelected,
      });
    },

    setTextContent: (nodeId, content) => {
      const { composition } = get();
      if (!composition) {
        return;
      }
      const next = updateNodePropValues(composition, nodeId, { content });
      if (!next.ok) {
        return;
      }
      set({
        composition: next.value,
        historyPast: [...get().historyPast, composition],
        historyFuture: [],
        dirty: true,
        canUndo: true,
        canRedo: false,
      });
    },

    patchNodeProps: (nodeId, patch) => {
      const { composition } = get();
      if (!composition) {
        return;
      }
      const next = updateNodePropValues(composition, nodeId, patch);
      if (!next.ok) {
        return;
      }
      set({
        composition: next.value,
        historyPast: [...get().historyPast, composition],
        historyFuture: [],
        dirty: true,
        canUndo: true,
        canRedo: false,
      });
    },

    setNodeStyleEntry: (nodeId, property, entry) => {
      const { composition, tokenMetadata } = get();
      if (!composition) {
        return;
      }
      if (entry?.type === "token") {
        const normalizedToken = entry.token.trim();
        if (
          !tokenMetadata.some((tokenMeta) => tokenMeta.key === normalizedToken)
        ) {
          set({ error: `Unknown token: ${normalizedToken}` });
          return;
        }
      }
      const next = setNodeStyleProperty(composition, nodeId, property, entry);
      if (!next.ok) {
        return;
      }
      set({
        error: null,
        composition: next.value,
        historyPast: [...get().historyPast, composition],
        historyFuture: [],
        dirty: true,
        canUndo: true,
        canRedo: false,
      });
    },

    resetNodePropKey: (nodeId, propKey) => {
      const { composition } = get();
      if (!composition) {
        return;
      }
      const next = resetNodePropKeyToPrimitiveDefault(
        composition,
        nodeId,
        propKey,
      );
      if (!next.ok) {
        return;
      }
      set({
        composition: next.value,
        historyPast: [...get().historyPast, composition],
        historyFuture: [],
        dirty: true,
        canUndo: true,
        canRedo: false,
      });
    },

    clearNodeStyles: (nodeId) => {
      const { composition } = get();
      if (!composition) {
        return;
      }
      const next = clearNodeStyleBinding(composition, nodeId);
      if (!next.ok) {
        return;
      }
      set({
        composition: next.value,
        historyPast: [...get().historyPast, composition],
        historyFuture: [],
        dirty: true,
        canUndo: true,
        canRedo: false,
      });
    },

    setNodeEditorFieldBinding: (nodeId, field) => {
      const { composition } = get();
      if (!composition) {
        return;
      }
      const binding =
        field === null
          ? undefined
          : { source: "editor" as const, key: field.name, editorField: field };
      const next = setNodeContentBinding(composition, nodeId, binding);
      if (!next.ok) {
        return;
      }
      set({
        composition: next.value,
        historyPast: [...get().historyPast, composition],
        historyFuture: [],
        dirty: true,
        canUndo: true,
        canRedo: false,
      });
    },

    setNodeCollectionFieldBinding: (nodeId, fieldPath) => {
      const { composition } = get();
      if (!composition) {
        return;
      }
      const trimmed = fieldPath?.trim() ?? "";
      const binding =
        trimmed === ""
          ? undefined
          : { source: "collection" as const, key: trimmed };
      const next = setNodeContentBinding(composition, nodeId, binding);
      if (!next.ok) {
        return;
      }
      set({
        composition: next.value,
        historyPast: [...get().historyPast, composition],
        historyFuture: [],
        dirty: true,
        canUndo: true,
        canRedo: false,
      });
    },

    saveDraft: async () => {
      await saveOrPublishComposition({ get, set, client, mode: "draft" });
    },

    publish: async () => {
      await saveOrPublishComposition({ get, set, client, mode: "publish" });
    },

    rename: async (nextName) => {
      await applyCompositionRename({ get, set, client, nextName });
    },
  }));
}

export type StudioStore = ReturnType<typeof createStudioStore>;
