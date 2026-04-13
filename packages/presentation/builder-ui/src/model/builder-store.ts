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
  postDraft,
  postPublish,
} from "../lib/builder-api.js";
import { prepareForSave } from "../lib/persist.js";

export type BuilderStoreState = {
  compositionId: string;
  composition: PageComposition | null;
  tokenMetadata: TokenMeta[];
  cssVariables: string;
  updatedAt: string | null;
  selectedNodeId: string | null;
  dirty: boolean;
  saving: boolean;
  error: string | null;
  load: () => Promise<void>;
  cancel: () => void;
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
};

export function createBuilderStore(compositionId: string) {
  return createSafeStore<BuilderStoreState>((set, get) => ({
    compositionId,
    composition: null,
    tokenMetadata: [],
    cssVariables: "",
    updatedAt: null,
    selectedNodeId: null,
    dirty: false,
    saving: false,
    error: null,

    cancel: () => {
      void get().load();
    },

    load: async () => {
      set({ error: null });
      try {
        const data = await fetchComposition(compositionId);
        set({
          composition: data.composition,
          tokenMetadata: data.tokenMetadata,
          cssVariables: data.cssVariables,
          updatedAt: data.updatedAt,
          dirty: false,
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
      set({
        composition: next.value,
        dirty: true,
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
      set({ composition: next.value, dirty: true });
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
        dirty: true,
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
      set({ composition: next.value, dirty: true });
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
      set({ composition: next.value, dirty: true });
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
      set({ composition: next.value, dirty: true });
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
      set({ composition: next.value, dirty: true });
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
  }));
}

export type BuilderStore = ReturnType<typeof createBuilderStore>;
