import { compileTokenSet } from "@repo/config-tailwind";
import {
  type PageComposition,
  PageCompositionSchema,
} from "@repo/contracts-zod";
import {
  compositionUsesLayoutSlots,
  editorFieldSpecsFromComposition,
  expandLibraryComponentNodes,
  mergeEditorFieldValuesIntoComposition,
} from "@repo/domains-composition";
import { defaultPrimitiveRegistry } from "@repo/runtime-primitives";
import { renderComposition } from "@repo/runtime-renderer";
import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";
import { getPayload } from "payload";
import type { ReactNode } from "react";

import { loadPublishedTokenSetForPreview } from "@/lib/load-published-token-set";
import { renderDesignerContentBlocksBySlot } from "@/lib/render-designer-content";
import { resolveImageEditorFieldValuesForRender } from "@/lib/resolve-editor-field-image-values";
import config from "@/payload.config";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

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

  const blocksRaw = (page as { content?: unknown }).content;
  const hasBlocks = Array.isArray(blocksRaw) && blocksRaw.length > 0;

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

  const tokenDoc = await loadPublishedTokenSetForPreview(payload);
  const tokens = tokenDoc
    ? tokenDoc.tokens.map((t) => ({
        key: t.key,
        category: t.category,
        resolvedValue: t.resolvedValue,
      }))
    : [];

  const compiled = compileTokenSet({ tokens });

  let templateTree: PageComposition | null = null;
  if (hasPageComposition && compositionDoc) {
    const parsed = PageCompositionSchema.safeParse(compositionDoc.composition);
    if (parsed.success) {
      templateTree = parsed.data;
    } else if (!hasBlocks) {
      notFound();
    }
  } else if (!hasBlocks) {
    notFound();
  }

  let slotContent: Record<string, ReactNode> | undefined;
  let designerSections: ReactNode[] = [];
  if (hasBlocks) {
    const r = await renderDesignerContentBlocksBySlot(
      payload,
      blocksRaw,
      compiled.tokenMetadata,
      templateTree,
    );
    const uses =
      templateTree !== null && compositionUsesLayoutSlots(templateTree);
    if (uses) {
      slotContent = r.slotContent;
      designerSections = r.orphanSections;
    } else {
      designerSections = [...Object.values(r.slotContent), ...r.orphanSections];
    }
  }

  let compositionTree: ReactNode = null;
  if (hasPageComposition && compositionDoc && templateTree) {
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
    const tmpl = (page as { templateEditorFields?: Record<string, unknown> })
      .templateEditorFields;
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
    compositionTree = renderComposition(
      tree,
      defaultPrimitiveRegistry,
      compiled.tokenMetadata,
      slotContent !== undefined ? { slotContent } : undefined,
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <style>{compiled.cssVariables}</style>
      <article className="mx-auto max-w-5xl p-6">
        {hasBlocks ? (
          <>
            {designerSections}
            {compositionTree}
          </>
        ) : (
          compositionTree
        )}
      </article>
    </div>
  );
}
