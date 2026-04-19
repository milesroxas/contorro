import type { EditorFieldSpec, PageComposition } from "@repo/contracts-zod";
import { PageCompositionSchema } from "@repo/contracts-zod";
import {
  editorFieldSpecsFromComposition,
  expandLibraryComponentNodes,
} from "@repo/domains-composition";
import type { Payload } from "payload";

import { resolveImageEditorFieldValuesForRender } from "@/lib/resolve-editor-field-image-values";

function relationshipId(ref: unknown): number | undefined {
  if (typeof ref === "number" && Number.isFinite(ref)) {
    return ref;
  }
  if (
    typeof ref === "object" &&
    ref !== null &&
    "id" in ref &&
    typeof (ref as { id: unknown }).id === "number"
  ) {
    return (ref as { id: number }).id;
  }
  return undefined;
}

function parseComposition(raw: unknown): PageComposition | null {
  const parsed = PageCompositionSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

async function loadPageTemplateCompositionById(args: {
  payload: Payload;
  user: unknown;
  pageCompositionId: number;
}): Promise<PageComposition | null> {
  const { payload, user, pageCompositionId } = args;
  try {
    const doc = await payload.findByID({
      collection: "page-compositions",
      id: pageCompositionId,
      depth: 0,
      draft: true,
      user,
      overrideAccess: !user,
    });
    return parseComposition((doc as { composition?: unknown })?.composition);
  } catch {
    return null;
  }
}

async function loadComponentCompositionByKey(args: {
  payload: Payload;
  user: unknown;
  key: string;
}): Promise<PageComposition | null> {
  const { payload, user, key } = args;
  try {
    const found = await payload.find({
      collection: "components",
      where: { key: { equals: key } },
      depth: 0,
      draft: true,
      limit: 1,
      user,
      overrideAccess: !user,
    });
    const doc = found.docs[0] as { composition?: unknown } | undefined;
    return parseComposition(doc?.composition);
  } catch {
    return null;
  }
}

export async function expandedPageTemplateCompositionForRelationship(args: {
  payload: Payload;
  user: unknown;
  pageComposition: unknown;
}): Promise<PageComposition | null> {
  const { payload, user, pageComposition } = args;
  const pageCompositionId = relationshipId(pageComposition);
  if (pageCompositionId === undefined) {
    return null;
  }
  const base = await loadPageTemplateCompositionById({
    payload,
    user,
    pageCompositionId,
  });
  if (!base) {
    return null;
  }
  return expandLibraryComponentNodes(
    base,
    async (componentKey) =>
      loadComponentCompositionByKey({ payload, user, key: componentKey }),
    {
      resolveEditorFieldImages: async (embedded, editorFieldValues) =>
        resolveImageEditorFieldValuesForRender(
          payload,
          editorFieldSpecsFromComposition(embedded),
          editorFieldValues,
        ),
    },
  );
}

export async function expandedPageTemplateEditorFieldSpecs(args: {
  payload: Payload;
  user: unknown;
  pageComposition: unknown;
}): Promise<EditorFieldSpec[] | null> {
  const expanded = await expandedPageTemplateCompositionForRelationship(args);
  if (!expanded) {
    return null;
  }
  return editorFieldSpecsFromComposition(expanded);
}
