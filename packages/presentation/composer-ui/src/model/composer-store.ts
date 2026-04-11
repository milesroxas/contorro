import type { PageComposition } from "@repo/contracts-zod";
import { updateNodePropValues } from "@repo/domains-composition";
import {
  createSafeStore,
  prepareCompositionForSave,
} from "@repo/presentation-shared";

import {
  fetchComposerPage,
  postComposerDraft,
  postPublishPage,
} from "../lib/composer-api.js";

export type ComposerStoreState = {
  pageId: string;
  pageTitle: string;
  pageSlug: string;
  compositionId: string;
  composition: PageComposition | null;
  updatedAt: string | null;
  selectedTextNodeId: string | null;
  dirty: boolean;
  error: string | null;
  load: () => Promise<void>;
  selectTextNode: (id: string | null) => void;
  setTextContent: (nodeId: string, content: string) => void;
  saveDraft: () => Promise<void>;
  publish: () => Promise<void>;
};

function findTextNodeIds(composition: PageComposition): string[] {
  return Object.values(composition.nodes)
    .filter((n) => n.definitionKey === "primitive.text")
    .map((n) => n.id);
}

export function createComposerStore(pageId: string) {
  return createSafeStore<ComposerStoreState>((set, get) => ({
    pageId,
    pageTitle: "",
    pageSlug: "",
    compositionId: "",
    composition: null,
    updatedAt: null,
    selectedTextNodeId: null,
    dirty: false,
    error: null,

    load: async () => {
      set({ error: null });
      try {
        const data = await fetchComposerPage(pageId);
        const textIds = findTextNodeIds(data.composition);
        set({
          pageTitle: data.title,
          pageSlug: data.slug,
          compositionId: data.compositionDocumentId,
          composition: data.composition,
          updatedAt: data.updatedAt,
          dirty: false,
          selectedTextNodeId: textIds[0] ?? null,
        });
      } catch (e) {
        set({
          error: e instanceof Error ? e.message : "load failed",
        });
      }
    },

    selectTextNode: (id) => set({ selectedTextNodeId: id }),

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

    saveDraft: async () => {
      const { composition, updatedAt, compositionId: id } = get();
      if (!composition) {
        return;
      }
      const prep = prepareCompositionForSave(composition);
      if (!prep.ok) {
        set({ error: "Invalid composition" });
        return;
      }
      set({ error: null });
      try {
        const nextUpdated = await postComposerDraft(id, {
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

    publish: async () => {
      const { pageId } = get();
      set({ error: null });
      try {
        await postPublishPage(pageId);
      } catch (e) {
        set({
          error: e instanceof Error ? e.message : "publish failed",
        });
      }
    },
  }));
}
