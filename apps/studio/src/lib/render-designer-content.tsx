import type { TokenMeta } from "@repo/config-tailwind";
import { PageCompositionSchema } from "@repo/contracts-zod";
import {
  collectLayoutSlotIds,
  mergeEditorFieldValuesIntoComposition,
  resolveEditorFieldsContractForDefinition,
} from "@repo/domains-composition";
import { defaultPrimitiveRegistry } from "@repo/runtime-primitives";
import { renderComposition } from "@repo/runtime-renderer";
import type { Payload } from "payload";
import { Fragment, type ReactNode } from "react";

import { resolveImageEditorFieldValuesForRender } from "@/lib/resolve-editor-field-image-values";

type DesignerBlock = {
  componentDefinition?: number | { id: number } | null;
  editorFieldValues?: Record<string, unknown> | null;
  layoutSlotId?: string | null;
};

type ContentSlotDoc = {
  slotId?: string | null;
  blocks?: DesignerBlock[] | null;
};

function isNestedContentSlots(raw: unknown): raw is ContentSlotDoc[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return false;
  }
  const first = raw[0];
  return (
    first !== null &&
    typeof first === "object" &&
    !Array.isArray(first) &&
    Array.isArray((first as ContentSlotDoc).blocks)
  );
}

/** Unnests `contentSlots` into flat blocks tagged with `layoutSlotId` for slot injection. */
export function flattenPageContentSlotsToBlocks(
  contentSlots: unknown,
): DesignerBlock[] {
  if (!isNestedContentSlots(contentSlots)) {
    return Array.isArray(contentSlots) ? (contentSlots as DesignerBlock[]) : [];
  }
  const out: DesignerBlock[] = [];
  for (const row of contentSlots) {
    const slotId =
      typeof row.slotId === "string" && row.slotId.trim() !== ""
        ? row.slotId.trim()
        : "main";
    const blocks = row.blocks;
    if (!Array.isArray(blocks)) {
      continue;
    }
    for (const b of blocks) {
      if (!b || typeof b !== "object") {
        continue;
      }
      out.push({
        ...(b as DesignerBlock),
        layoutSlotId: slotId,
      });
    }
  }
  return out;
}

function blockSlotId(block: DesignerBlock): string {
  const raw = block.layoutSlotId;
  if (typeof raw === "string" && raw.trim() !== "") {
    return raw.trim();
  }
  return "main";
}

async function renderOneBlock(
  payload: Payload,
  block: DesignerBlock,
  tokenMeta: TokenMeta[],
  blockIndex: number,
): Promise<ReactNode | null> {
  const defRef = block.componentDefinition;
  const defId =
    typeof defRef === "object" &&
    defRef !== null &&
    "id" in defRef &&
    typeof (defRef as { id: unknown }).id === "number"
      ? (defRef as { id: number }).id
      : typeof defRef === "number"
        ? defRef
        : undefined;
  if (defId === undefined) {
    return null;
  }

  const def = await payload.findByID({
    collection: "components",
    id: defId,
    depth: 0,
  });
  if (!def || def.composition === undefined || def.composition === null) {
    return null;
  }

  const parsed = PageCompositionSchema.safeParse(def.composition);
  if (!parsed.success) {
    return null;
  }
  const resolved = resolveEditorFieldsContractForDefinition({
    composition: def.composition,
    editorFields: (def as { editorFields?: unknown }).editorFields,
  });
  if (!resolved.ok) {
    return null;
  }

  const rawValues = (block.editorFieldValues ?? {}) as Record<string, unknown>;
  const imageResolved = await resolveImageEditorFieldValuesForRender(
    payload,
    resolved.contract.editorFields,
    rawValues,
  );

  const merged = mergeEditorFieldValuesIntoComposition(
    parsed.data,
    imageResolved,
  );

  return (
    <Fragment key={`designer-${defId}-${blockIndex}`}>
      {renderComposition(merged, defaultPrimitiveRegistry, tokenMeta)}
    </Fragment>
  );
}

export type RenderedDesignerBlocksBySlot = {
  /** React nodes grouped by layout slot id (for `renderComposition` `slotContent`). */
  slotContent: Record<string, ReactNode>;
  /** Blocks whose slot id does not match the template (or no matching slot); render outside the tree. */
  orphanSections: ReactNode[];
};

/** Renders page `content` blocks, grouped for layout slot injection and orphan fallback. */
export async function renderDesignerContentBlocksBySlot(
  payload: Payload,
  contentSlots: unknown,
  tokenMeta: TokenMeta[],
  templateComposition: import("@repo/contracts-zod").PageComposition | null,
): Promise<RenderedDesignerBlocksBySlot> {
  const blocks = flattenPageContentSlotsToBlocks(contentSlots);
  if (blocks.length === 0) {
    return { slotContent: {}, orphanSections: [] };
  }

  const templateSlotIds =
    templateComposition === null
      ? null
      : collectLayoutSlotIds(templateComposition);

  const slotLists: Record<string, ReactNode[]> = {};
  const orphanSections: ReactNode[] = [];

  let blockIndex = 0;
  for (const block of blocks) {
    const section = await renderOneBlock(payload, block, tokenMeta, blockIndex);
    blockIndex += 1;
    if (section === null) {
      continue;
    }

    if (templateSlotIds === null || templateSlotIds.size === 0) {
      orphanSections.push(section);
      continue;
    }

    const sid = blockSlotId(block);
    const target = templateSlotIds.has(sid)
      ? sid
      : templateSlotIds.has("main")
        ? "main"
        : null;

    if (target === null) {
      orphanSections.push(section);
    } else {
      if (!slotLists[target]) {
        slotLists[target] = [];
      }
      slotLists[target].push(section);
    }
  }

  const slotContent: Record<string, ReactNode> = {};
  for (const [k, list] of Object.entries(slotLists)) {
    slotContent[k] = list;
  }

  return { slotContent, orphanSections };
}
