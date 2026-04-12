import {
  type EditorSlotContract,
  type PageComposition,
  PageCompositionSchema,
  type SlotDefinition,
  parseEditorSlotContract,
} from "@repo/contracts-zod";

/** Collects v0.4 slot definitions from nodes whose `contentBinding.source` is `slot`. */
export function slotDefinitionsFromComposition(
  c: PageComposition,
): SlotDefinition[] {
  const out: SlotDefinition[] = [];
  for (const node of Object.values(c.nodes)) {
    const cb = node.contentBinding;
    if (cb?.source === "slot" && cb.slot) {
      out.push(cb.slot);
    }
  }
  out.sort((a, b) => a.name.localeCompare(b.name));
  return out;
}

/** Canonical `{ slots }` document for Payload — derived from the template tree (no separate JSON contract). */
export function editorSlotContractFromComposition(
  c: PageComposition,
): EditorSlotContract {
  return { slots: slotDefinitionsFromComposition(c) };
}

/**
 * Effective editor slot contract for a published component definition.
 * The composition tree is canonical: when it parses, slots are derived from it; otherwise
 * stored `slotContract` is used (legacy / partial documents).
 */
export function resolveEditorSlotContractForDefinition(args: {
  composition: unknown;
  slotContract?: unknown;
}): { ok: true; contract: EditorSlotContract } | { ok: false } {
  const { composition, slotContract } = args;
  if (composition !== undefined && composition !== null) {
    const comp = PageCompositionSchema.safeParse(composition);
    if (comp.success) {
      return {
        ok: true,
        contract: editorSlotContractFromComposition(comp.data),
      };
    }
  }
  const parsed = parseEditorSlotContract(slotContract ?? { slots: [] });
  if (parsed.ok) {
    return { ok: true, contract: parsed.data };
  }
  return { ok: false };
}
