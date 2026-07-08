import {
  type PageComposition,
  PageCompositionSchema,
} from "@repo/contracts-zod";
import {
  compositionUsesLayoutSlots,
  normalizeTemplateShell,
} from "@repo/domains-composition";
import {
  defaultPrimitiveRegistry,
  renderComposition,
} from "@repo/runtime-renderer";
import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";
import { getPayload, type Payload } from "payload";
import type { ReactNode } from "react";

import {
  expandDesignComposition,
  renderPageBlocksBySlot,
} from "@/lib/render-designer-content";
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

function relationId(rel: unknown): number | null {
  if (typeof rel === "number") {
    return rel;
  }
  if (
    typeof rel === "object" &&
    rel !== null &&
    "id" in rel &&
    typeof (rel as { id: unknown }).id === "number"
  ) {
    return (rel as { id: number }).id;
  }
  return null;
}

/**
 * Template composition for the page. Outside preview the populated
 * relationship is used as-is (access control already scoped it to published);
 * in preview the template is re-fetched with `draft: true` (audit M3/M8).
 */
async function templateTreeForPage(
  payload: Payload,
  pageComposition: unknown,
  isPreview: boolean,
  slug: string,
): Promise<PageComposition | null> {
  let raw: unknown;

  if (isPreview) {
    const id = relationId(pageComposition);
    if (id === null) {
      return null;
    }
    try {
      const doc = await payload.findByID({
        collection: "page-compositions",
        id,
        depth: 0,
        draft: true,
        overrideAccess: true,
      });
      raw = doc?.composition;
    } catch {
      payload.logger.error(
        `render: page "${slug}": failed to load draft template ${id}`,
      );
      return null;
    }
  } else if (
    typeof pageComposition === "object" &&
    pageComposition !== null &&
    "composition" in pageComposition
  ) {
    raw = (pageComposition as { composition?: unknown }).composition;
  } else {
    if (pageComposition !== null && pageComposition !== undefined) {
      payload.logger.error(
        `render: page "${slug}": template relationship not populated (unpublished template?)`,
      );
    }
    return null;
  }

  if (raw === undefined || raw === null) {
    return null;
  }
  const parsed = PageCompositionSchema.safeParse(raw);
  if (!parsed.success) {
    payload.logger.error(
      `render: page "${slug}": template composition failed to parse`,
    );
    return null;
  }
  return normalizeTemplateShell(parsed.data);
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

  // depth 2 populates each block's `design` (components doc) and `image`
  // uploads; anonymous requests run through access control so only published
  // relations arrive populated.
  const found = await payload.find({
    collection: "pages",
    where: { slug: { equals: slug } },
    depth: 2,
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

  const templateTree = await templateTreeForPage(
    payload,
    page.pageComposition,
    isEnabled,
    slug,
  );

  if (!hasBlocks && templateTree === null) {
    notFound();
  }

  const { slotContent, orphanSections } = hasBlocks
    ? await renderPageBlocksBySlot(payload, contentSlots, templateTree, {
        draft: isEnabled,
      })
    : { slotContent: {}, orphanSections: [] as ReactNode[] };

  let compositionTree: ReactNode = null;
  let sectionsOutsideTree: ReactNode[] = orphanSections;

  if (templateTree !== null) {
    const expanded = await expandDesignComposition(
      payload,
      templateTree,
      isEnabled,
      `page "${slug}" template`,
    );
    const usesSlots = compositionUsesLayoutSlots(expanded);
    if (!usesSlots) {
      // No slot nodes: render every block after the template output.
      sectionsOutsideTree = [...Object.values(slotContent), ...orphanSections];
    }
    compositionTree = renderComposition(
      expanded,
      defaultPrimitiveRegistry,
      usesSlots ? { slotContent } : undefined,
    );
  } else {
    sectionsOutsideTree = [...Object.values(slotContent), ...orphanSections];
  }

  return (
    <>
      {compositionTree}
      {sectionsOutsideTree}
    </>
  );
}
