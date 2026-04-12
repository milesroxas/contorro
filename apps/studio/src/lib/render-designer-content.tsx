import type { TokenMeta } from "@repo/config-tailwind";
import { PageCompositionSchema } from "@repo/contracts-zod";
import {
  mergeSlotValuesIntoComposition,
  resolveEditorSlotContractForDefinition,
} from "@repo/domains-composition";
import { defaultPrimitiveRegistry } from "@repo/runtime-primitives";
import { renderComposition } from "@repo/runtime-renderer";
import type { Payload } from "payload";
import type { ReactNode } from "react";

import { resolveImageSlotValuesForRender } from "@/lib/resolve-slot-values-for-render";

type DesignerBlock = {
  componentDefinition?: number | { id: number } | null;
  slotValues?: Record<string, unknown> | null;
};

/** Renders v0.4 page `content` array blocks (template from definition + slot substitution). */
export async function renderDesignerContentBlocks(
  payload: Payload,
  blocks: unknown,
  tokenMeta: TokenMeta[],
): Promise<ReactNode[]> {
  if (!Array.isArray(blocks)) {
    return [];
  }
  const out: ReactNode[] = [];
  let blockIndex = 0;
  for (const block of blocks as DesignerBlock[]) {
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
      blockIndex += 1;
      continue;
    }

    const def = await payload.findByID({
      collection: "component-definitions",
      id: defId,
      depth: 0,
    });
    if (!def || def.composition === undefined || def.composition === null) {
      blockIndex += 1;
      continue;
    }

    const parsed = PageCompositionSchema.safeParse(def.composition);
    if (!parsed.success) {
      blockIndex += 1;
      continue;
    }
    const slotResolved = resolveEditorSlotContractForDefinition({
      composition: def.composition,
      slotContract: def.slotContract,
    });
    if (!slotResolved.ok) {
      blockIndex += 1;
      continue;
    }

    const rawValues = (block.slotValues ?? {}) as Record<string, unknown>;
    const resolved = await resolveImageSlotValuesForRender(
      payload,
      slotResolved.contract.slots,
      rawValues,
    );

    const merged = mergeSlotValuesIntoComposition(parsed.data, resolved);

    out.push(
      <section
        className="designer-component-block mb-8"
        data-definition-id={defId}
        key={`designer-${defId}-${blockIndex}`}
      >
        {renderComposition(merged, defaultPrimitiveRegistry, tokenMeta)}
      </section>,
    );
    blockIndex += 1;
  }
  return out;
}
