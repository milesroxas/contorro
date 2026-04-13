import type { TokenMeta } from "@repo/config-tailwind";
import type {
  EditorFieldSpec,
  PageComposition,
  StyleProperty,
} from "@repo/contracts-zod";
import {
  addChildNode,
  moveNode as moveNodeInComposition,
  removeSubtree,
  setNodeContentBinding,
  setNodeTokenStyle,
  updateNodePropValues,
} from "@repo/domains-composition";
import { createSafeStore } from "@repo/presentation-shared";

import {
  fetchComposition,
  patchName,
  postDraft,
  postPublish,
} from "../lib/builder-api.js";
import { prepareForSave } from "../lib/persist.js";

export type BuilderStoreState = {
  compositionId: string;
  composition: PageComposition | null;
  name: string;
  historyPast: PageComposition[];
  historyFuture: PageComposition[];
  tokenMetadata: TokenMeta[];
  cssVariables: string;
  updatedAt: string | null;
  selectedNodeId: string | null;
  dirty: boolean;
  saving: boolean;
  renaming: boolean;
  error: string | null;
  canUndo: boolean;
  canRedo: boolean;
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
  setNodeStyleToken: (
    nodeId: string,
    property: StyleProperty,
    token: string,
  ) => void;
  setNodeEditorFieldBinding: (
    nodeId: string,
    field: EditorFieldSpec | null,
  ) => void;
  saveDraft: () => Promise<void>;
  publish: () => Promise<void>;
  rename: (name: string) => Promise<void>;
};

export function createBuilderStore(compositionId: string) {
  return createSafeStore<BuilderStoreState>((set, get) => ({
    compositionId,
    composition: null,
    name: "",
    historyPast: [],
    historyFuture: [],
    tokenMetadata: [],
    cssVariables: "",
    updatedAt: null,
    selectedNodeId: null,
    dirty: false,
    saving: false,
    renaming: false,
    error: null,
    canUndo: false,
    canRedo: false,

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
        const data = await fetchComposition(compositionId);
        set({
          composition: data.composition,
          name: data.name,
          historyPast: [],
          historyFuture: [],
          tokenMetadata: data.tokenMetadata,
          cssVariables: data.cssVariables,
          updatedAt: data.updatedAt,
          dirty: false,
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

    selectNode: (id) => set({ selectedNodeId: id }),

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

    setNodeStyleToken: (nodeId, property, token) => {
      const { composition } = get();
      if (!composition) {
        return;
      }
      const next = setNodeTokenStyle(composition, nodeId, property, token);
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

    saveDraft: async () => {
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
        const nextUpdated = await postDraft(id, {
          composition: prep.data,
          ifMatchUpdatedAt: updatedAt,
        });
        set({ updatedAt: nextUpdated, dirty: false });
      } catch (e) {
        set({
          error: e instanceof Error ? e.message : "save failed",
        });
      } finally {
        set({ saving: false });
      }
    },

    publish: async () => {
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
        const nextUpdated = await postPublish(id, {
          composition: prep.data,
          ifMatchUpdatedAt: updatedAt,
        });
        set({ updatedAt: nextUpdated, dirty: false });
      } catch (e) {
        set({
          error: e instanceof Error ? e.message : "publish failed",
        });
      } finally {
        set({ saving: false });
      }
    },

    rename: async (nextName) => {
      const trimmed = nextName.trim();
      const { compositionId: id, renaming, name } = get();
      if (!trimmed || renaming || trimmed === name) {
        return;
      }
      set({ error: null, renaming: true });
      try {
        const data = await patchName(id, trimmed);
        set({ name: data.name, updatedAt: data.updatedAt });
      } catch (e) {
        set({
          error: e instanceof Error ? e.message : "rename failed",
        });
      } finally {
        set({ renaming: false });
      }
    },
  }));
}

export type BuilderStore = ReturnType<typeof createBuilderStore>;
