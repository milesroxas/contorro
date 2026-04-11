import type { PageComposition } from "@repo/contracts-zod";
import {
  addChildNode,
  moveNode as moveNodeInComposition,
  removeSubtree,
  setNodeTokenStyle,
  updateNodePropValues,
} from "@repo/domains-composition";
import { createSafeStore } from "@repo/presentation-shared";

import { fetchComposition, postDraft } from "../lib/builder-api.js";
import { prepareForSave } from "../lib/persist.js";

export type BuilderStoreState = {
  compositionId: string;
  composition: PageComposition | null;
  updatedAt: string | null;
  selectedNodeId: string | null;
  dirty: boolean;
  error: string | null;
  load: () => Promise<void>;
  selectNode: (id: string | null) => void;
  addPrimitive: (
    parentId: string,
    definitionKey: string,
    insertIndex?: number,
  ) => void;
  moveNode: (nodeId: string, targetParentId: string, index: number) => void;
  removeNode: (nodeId: string) => void;
  setTextContent: (nodeId: string, content: string) => void;
  setBackgroundToken: (nodeId: string, token: string) => void;
  saveDraft: () => Promise<void>;
};

export function createBuilderStore(compositionId: string) {
  return createSafeStore<BuilderStoreState>((set, get) => ({
    compositionId,
    composition: null,
    updatedAt: null,
    selectedNodeId: null,
    dirty: false,
    error: null,

    load: async () => {
      set({ error: null });
      try {
        const data = await fetchComposition(compositionId);
        set({
          composition: data.composition,
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

    addPrimitive: (parentId, definitionKey, insertIndex) => {
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

    setBackgroundToken: (nodeId, token) => {
      const { composition } = get();
      if (!composition) {
        return;
      }
      const next = setNodeTokenStyle(composition, nodeId, "background", token);
      if (!next.ok) {
        return;
      }
      set({ composition: next.value, dirty: true });
    },

    saveDraft: async () => {
      const { composition, updatedAt, compositionId: id } = get();
      if (!composition) {
        return;
      }
      const prep = prepareForSave(composition);
      if (!prep.ok) {
        set({ error: "Invalid composition" });
        return;
      }
      set({ error: null });
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
      }
    },
  }));
}

export type BuilderStore = ReturnType<typeof createBuilderStore>;
