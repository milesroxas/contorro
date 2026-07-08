import {
  type BlockCatalogEntry,
  blockCatalogEntry,
  type PageComposition,
  PageCompositionSchema,
} from "@repo/contracts-zod";
import {
  collectLayoutSlotIds,
  expandLibraryComponentNodes,
} from "@repo/domains-composition";
import {
  defaultPrimitiveRegistry,
  injectBlockValues,
  renderComposition,
} from "@repo/runtime-renderer";
import type { Payload } from "payload";
import { Fragment, type ReactNode } from "react";

export type PageBlockRow = {
  id?: string | null;
  blockType?: string | null;
  design?: number | { id?: number; composition?: unknown } | null;
} & Record<string, unknown>;

export type ContentSlotRow = {
  slotId?: string | null;
  blocks?: PageBlockRow[] | null;
};

export type RenderPageBlocksOptions = {
  /** Draft mode: block designs are re-fetched with `draft: true` (audit M3/M8). */
  draft?: boolean;
};

function contentSlotRows(contentSlots: unknown): ContentSlotRow[] {
  if (!Array.isArray(contentSlots)) {
    return [];
  }
  return contentSlots.filter(
    (row): row is ContentSlotRow =>
      row !== null && typeof row === "object" && !Array.isArray(row),
  );
}

function rowSlotId(row: ContentSlotRow): string {
  return typeof row.slotId === "string" && row.slotId.trim() !== ""
    ? row.slotId.trim()
    : "main";
}

async function resolveEmbeddedDesign(
  payload: Payload,
  key: string,
  draft: boolean,
): Promise<PageComposition | null> {
  const found = await payload.find({
    collection: "components",
    where: { key: { equals: key } },
    depth: 0,
    draft,
    limit: 1,
    overrideAccess: true,
  });
  const doc = found.docs[0] as { composition?: unknown } | undefined;
  if (!doc?.composition) {
    return null;
  }
  const parsed = PageCompositionSchema.safeParse(doc.composition);
  return parsed.success ? parsed.data : null;
}

/** Expands embedded library refs (design-only) with skip logging. */
export async function expandDesignComposition(
  payload: Payload,
  composition: PageComposition,
  draft: boolean,
  context: string,
): Promise<PageComposition> {
  return expandLibraryComponentNodes(
    composition,
    (key) => resolveEmbeddedDesign(payload, key, draft),
    {
      onSkip: (refId, componentKey, reason) => {
        payload.logger.error(
          `render: skipped library ref "${refId}" (component "${componentKey}") in ${context}: ${reason}`,
        );
      },
    },
  );
}

function blockDesignId(rel: PageBlockRow["design"]): number | null {
  if (typeof rel === "number") {
    return rel;
  }
  if (typeof rel === "object" && rel !== null && typeof rel.id === "number") {
    return rel.id;
  }
  return null;
}

/** Preview renders the latest draft of the design explicitly (audit M3/M8). */
async function draftDesignComposition(
  payload: Payload,
  designId: number,
): Promise<{ composition: unknown; designId: number } | null> {
  try {
    const doc = await payload.findByID({
      collection: "components",
      id: designId,
      depth: 0,
      draft: true,
      overrideAccess: true,
    });
    return doc?.composition !== undefined && doc.composition !== null
      ? { composition: doc.composition, designId }
      : null;
  } catch {
    return null;
  }
}

async function designCompositionForBlock(
  payload: Payload,
  block: PageBlockRow,
  draft: boolean,
): Promise<{ composition: unknown; designId: number } | null> {
  const rel = block.design;
  const designId = blockDesignId(rel);
  if (designId === null) {
    return null;
  }
  if (draft) {
    return draftDesignComposition(payload, designId);
  }
  if (
    typeof rel === "object" &&
    rel !== null &&
    "composition" in rel &&
    rel.composition !== undefined &&
    rel.composition !== null
  ) {
    return { composition: rel.composition, designId };
  }
  return null;
}

async function renderOneBlock(
  payload: Payload,
  block: PageBlockRow,
  blockIndex: number,
  options: RenderPageBlocksOptions,
): Promise<ReactNode | null> {
  const slug = typeof block.blockType === "string" ? block.blockType : "";
  const entry: BlockCatalogEntry | null =
    slug !== "" ? blockCatalogEntry(slug) : null;
  if (!entry) {
    payload.logger.error(
      `render: skipped block #${blockIndex}: unknown block type "${slug}"`,
    );
    return null;
  }

  const draft = options.draft === true;
  const resolved = await designCompositionForBlock(payload, block, draft);
  if (!resolved) {
    payload.logger.error(
      `render: skipped "${slug}" block #${blockIndex}: design not populated (unpublished or access-denied design?)`,
    );
    return null;
  }

  const parsed = PageCompositionSchema.safeParse(resolved.composition);
  if (!parsed.success) {
    payload.logger.error(
      `render: skipped "${slug}" block #${blockIndex}: design ${resolved.designId} composition failed to parse`,
    );
    return null;
  }

  const expanded = await expandDesignComposition(
    payload,
    parsed.data,
    draft,
    `"${slug}" block design ${resolved.designId}`,
  );

  const injected = injectBlockValues(expanded, block, entry);

  return (
    <Fragment key={`block-${slug}-${resolved.designId}-${blockIndex}`}>
      {renderComposition(injected, defaultPrimitiveRegistry)}
    </Fragment>
  );
}

export type RenderedPageBlocksBySlot = {
  /** React nodes grouped by layout slot id (for `renderComposition` `slotContent`). */
  slotContent: Record<string, ReactNode>;
  /** Blocks with no matching template slot at all; render outside the tree. */
  orphanSections: ReactNode[];
};

function targetSlotId(
  sid: string,
  templateSlotIds: Set<string> | null,
): string | null {
  if (templateSlotIds === null || templateSlotIds.size === 0) {
    return null;
  }
  if (templateSlotIds.has(sid)) {
    return sid;
  }
  // Unknown slot ids render into main when the template has one.
  return templateSlotIds.has("main") ? "main" : null;
}

type SlotBuckets = {
  slotLists: Record<string, ReactNode[]>;
  orphanSections: ReactNode[];
};

function appendToSlotBuckets(
  buckets: SlotBuckets,
  section: ReactNode,
  sid: string,
  templateSlotIds: Set<string> | null,
): void {
  const target = targetSlotId(sid, templateSlotIds);
  if (target === null) {
    buckets.orphanSections.push(section);
    return;
  }
  const list = buckets.slotLists[target] ?? [];
  list.push(section);
  buckets.slotLists[target] = list;
}

/** Renders page `contentSlots` blocks, grouped for layout slot injection. */
export async function renderPageBlocksBySlot(
  payload: Payload,
  contentSlots: unknown,
  templateComposition: PageComposition | null,
  options: RenderPageBlocksOptions = {},
): Promise<RenderedPageBlocksBySlot> {
  const rows = contentSlotRows(contentSlots);
  const templateSlotIds =
    templateComposition === null
      ? null
      : collectLayoutSlotIds(templateComposition);

  const buckets: SlotBuckets = { slotLists: {}, orphanSections: [] };

  let blockIndex = 0;
  for (const row of rows) {
    const sid = rowSlotId(row);
    const blocks = Array.isArray(row.blocks) ? row.blocks : [];
    for (const block of blocks) {
      if (!block || typeof block !== "object") {
        continue;
      }
      const section = await renderOneBlock(payload, block, blockIndex, options);
      blockIndex += 1;
      if (section !== null) {
        appendToSlotBuckets(buckets, section, sid, templateSlotIds);
      }
    }
  }

  const slotContent: Record<string, ReactNode> = {};
  for (const [k, list] of Object.entries(buckets.slotLists)) {
    slotContent[k] = list;
  }

  return { slotContent, orphanSections: buckets.orphanSections };
}
