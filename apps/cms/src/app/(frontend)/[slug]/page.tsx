import {
  type PageComposition,
  PageCompositionSchema,
} from "@repo/contracts-zod";
import {
  compositionUsesLayoutSlots,
  editorFieldSpecsFromComposition,
  expandLibraryComponentNodes,
  mergeEditorFieldValuesIntoComposition,
  normalizeTemplateShell,
} from "@repo/domains-composition";
import { defaultPrimitiveRegistry } from "@repo/runtime-primitives";
import { renderComposition } from "@repo/runtime-renderer";
import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";
import { getPayload } from "payload";
import type { ReactNode } from "react";
import { loadFrontendDesignSystemBundle } from "@/lib/load-frontend-design-system-bundle";

import { renderDesignerContentBlocksBySlot } from "@/lib/render-designer-content";
import { resolveImageEditorFieldValuesForRender } from "@/lib/resolve-editor-field-image-values";
import config from "@/payload.config";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

function contentSlotsHasRenderableBlocks(contentSlots: unknown): boolean {
  return (
    Array.isArray(contentSlots) &&
    contentSlots.some(
      (row) =>
        row &&
        typeof row === "object" &&
        Array.isArray((row as { blocks?: unknown }).blocks) &&
        (row as { blocks: unknown[] }).blocks.length > 0,
    )
  );
}

async function slotContentAndDesignerSections(
  payload: Awaited<ReturnType<typeof getPayload>>,
  contentSlots: unknown,
  tokenMeta: import("@repo/config-tailwind").TokenMeta[],
  templateTree: PageComposition | null,
  hasBlocks: boolean,
): Promise<{
  slotContent: Record<string, ReactNode> | undefined;
  designerSections: ReactNode[];
}> {
  if (!hasBlocks) {
    return { slotContent: undefined, designerSections: [] };
  }
  const r = await renderDesignerContentBlocksBySlot(
    payload,
    contentSlots,
    tokenMeta,
    templateTree,
  );
  const uses =
    templateTree !== null && compositionUsesLayoutSlots(templateTree);
  if (uses) {
    return { slotContent: r.slotContent, designerSections: r.orphanSections };
  }
  return {
    slotContent: undefined,
    designerSections: [...Object.values(r.slotContent), ...r.orphanSections],
  };
}

async function renderCompositionWithLibraryAndEditorFields(
  payload: Awaited<ReturnType<typeof getPayload>>,
  page: {
    templateEditorFields?: Record<string, unknown>;
  },
  isEnabled: boolean,
  templateTree: PageComposition,
  tokenMeta: import("@repo/config-tailwind").TokenMeta[],
  slotContent: Record<string, ReactNode> | undefined,
): Promise<ReactNode> {
  let tree = await expandLibraryComponentNodes(templateTree, async (key) => {
    const found = await payload.find({
      collection: "components",
      where: { key: { equals: key } },
      depth: 0,
      draft: isEnabled,
      limit: 1,
      overrideAccess: true,
    });
    const doc = found.docs[0] as { composition?: unknown } | undefined;
    if (!doc?.composition) {
      return null;
    }
    const parsed = PageCompositionSchema.safeParse(doc.composition);
    return parsed.success ? parsed.data : null;
  });
  const tmpl = page.templateEditorFields;
  if (
    tmpl &&
    typeof tmpl === "object" &&
    !Array.isArray(tmpl) &&
    Object.keys(tmpl).length > 0
  ) {
    const fieldSpecs = editorFieldSpecsFromComposition(tree);
    const resolved = await resolveImageEditorFieldValuesForRender(
      payload,
      fieldSpecs,
      tmpl,
    );
    tree = mergeEditorFieldValuesIntoComposition(tree, resolved);
  }
  return renderComposition(
    tree,
    defaultPrimitiveRegistry,
    tokenMeta,
    slotContent !== undefined ? { slotContent } : undefined,
  );
}

function templateTreeFromPageComposition(
  hasPageComposition: boolean,
  compositionDoc: { composition?: unknown } | null,
  hasBlocks: boolean,
): PageComposition | null {
  let templateTree: PageComposition | null = null;
  if (hasPageComposition && compositionDoc) {
    const parsed = PageCompositionSchema.safeParse(compositionDoc.composition);
    if (parsed.success) {
      templateTree = normalizeTemplateShell(parsed.data);
    } else if (!hasBlocks) {
      notFound();
    }
  } else if (!hasBlocks) {
    notFound();
  }
  return templateTree;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { isEnabled } = await draftMode();
  const payloadConfig = await config;
  const payload = await getPayload({ config: payloadConfig });
  const found = await payload.find({
    collection: "pages",
    where: { slug: { equals: slug } },
    depth: 0,
    limit: 1,
    draft: isEnabled,
    overrideAccess: isEnabled,
  });
  const page = found.docs[0];
  const title =
    page && typeof page === "object" && "title" in page
      ? String((page as { title?: unknown }).title)
      : slug;
  return { title };
}

export default async function SitePage({ params }: Props) {
  const { slug } = await params;
  const { isEnabled } = await draftMode();

  const payloadConfig = await config;
  const payload = await getPayload({ config: payloadConfig });

  const found = await payload.find({
    collection: "pages",
    where: { slug: { equals: slug } },
    depth: 1,
    limit: 1,
    draft: isEnabled,
    overrideAccess: isEnabled,
  });

  const page = found.docs[0];
  if (!page) {
    notFound();
  }

  const contentSlots = (page as { contentSlots?: unknown }).contentSlots;
  const hasBlocks = contentSlotsHasRenderableBlocks(contentSlots);

  const rel = page.pageComposition;
  const compositionDoc =
    typeof rel === "object" && rel !== null && "composition" in rel
      ? rel
      : null;
  const hasPageComposition =
    compositionDoc !== null && compositionDoc.composition !== undefined;

  if (!hasBlocks && !hasPageComposition) {
    notFound();
  }

  const { compiled } = await loadFrontendDesignSystemBundle();

  const templateTree = templateTreeFromPageComposition(
    hasPageComposition,
    compositionDoc,
    hasBlocks,
  );

  const { slotContent, designerSections } =
    await slotContentAndDesignerSections(
      payload,
      contentSlots,
      compiled.tokenMetadata,
      templateTree,
      hasBlocks,
    );

  let compositionTree: ReactNode = null;
  if (hasPageComposition && compositionDoc && templateTree) {
    compositionTree = await renderCompositionWithLibraryAndEditorFields(
      payload,
      page as { templateEditorFields?: Record<string, unknown> },
      isEnabled,
      templateTree,
      compiled.tokenMetadata,
      slotContent,
    );
  }

  return hasBlocks ? (
    <>
      {designerSections}
      {compositionTree}
    </>
  ) : (
    compositionTree
  );
}
