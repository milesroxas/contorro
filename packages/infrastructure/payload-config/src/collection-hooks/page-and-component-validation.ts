import {
  PageCompositionSchema,
  PropContractSchema,
  parseEditorSlotContract,
} from "@repo/contracts-zod";
import {
  editorSlotContractFromComposition,
  resolveEditorSlotContractForDefinition,
  validateEditorSlotValues,
  validatePageCompositionInvariants,
} from "@repo/domains-composition";
import type { CollectionBeforeValidateHook } from "payload";
import { APIError } from "payload";

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

export function createPageCompositionBeforeValidateHandler(): CollectionBeforeValidateHook {
  return ({ data }) => {
    if (!data) {
      return data;
    }

    const raw = (data as { composition?: unknown }).composition;
    if (raw === undefined || raw === null) {
      throw new APIError("Composition is required", 400);
    }

    const parsed = PageCompositionSchema.safeParse(raw);
    if (!parsed.success) {
      throw new APIError("Invalid page composition shape", 400);
    }

    const inv = validatePageCompositionInvariants(parsed.data);
    if (!inv.ok) {
      throw new APIError(inv.error, 400);
    }

    return {
      ...data,
      composition: parsed.data,
    };
  };
}

export function createPagesBeforeValidateHandler(): CollectionBeforeValidateHook {
  return async ({ data, req, operation, originalDoc }) => {
    if (!data || typeof data !== "object") {
      return data;
    }
    const next = { ...data } as Record<string, unknown>;
    if (typeof next.slug === "string") {
      next.slug = next.slug.trim();
    }
    if (typeof next.title === "string") {
      next.title = next.title.trim();
    }

    /**
     * Payload passes partial `data` on update; validate against merged view so we do not
     * false-negative “template vs blocks” or slot checks when unrelated fields change.
     * @see https://payloadcms.com/docs/hooks/collections — beforeValidate `originalDoc`
     */
    const base: Record<string, unknown> =
      operation === "update" &&
      originalDoc !== undefined &&
      originalDoc !== null &&
      typeof originalDoc === "object"
        ? { ...(originalDoc as Record<string, unknown>), ...next }
        : next;

    const rawContent = base.content;
    const hasBlocks = Array.isArray(rawContent) && rawContent.length > 0;
    const pc = base.pageComposition;
    const hasComposition = pc !== undefined && pc !== null && pc !== "";

    if (!hasBlocks && !hasComposition) {
      throw new APIError(
        "Set either a page template or at least one designer block.",
        400,
      );
    }

    if (hasBlocks) {
      for (const block of rawContent as {
        componentDefinition?: unknown;
        slotValues?: unknown;
      }[]) {
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
          throw new APIError(
            "Designer block: missing component definition.",
            400,
          );
        }

        const doc = await req.payload.findByID({
          collection: "component-definitions",
          id: defId,
          depth: 0,
        });
        if (!doc) {
          throw new APIError("Designer block: definition not found.", 400);
        }
        if (doc.composition === undefined || doc.composition === null) {
          throw new APIError(
            "Designer block: definition has no template composition (publish from the builder or set composition on the definition).",
            400,
          );
        }

        const slotResolved = resolveEditorSlotContractForDefinition({
          composition: doc.composition,
          slotContract: doc.slotContract,
        });
        if (!slotResolved.ok) {
          throw new APIError("Invalid slot contract on definition.", 400);
        }
        const vs = validateEditorSlotValues(
          slotResolved.contract,
          block.slotValues as Record<string, unknown> | undefined,
        );
        if (!vs.ok) {
          throw new APIError(vs.error, 400);
        }
      }
    }

    if (hasComposition) {
      const pcId = relationshipId(pc);
      if (pcId !== undefined) {
        const pDoc = await req.payload.findByID({
          collection: "page-compositions",
          id: pcId,
          depth: 0,
        });
        if (pDoc?.composition) {
          const pComp = PageCompositionSchema.safeParse(pDoc.composition);
          if (pComp.success) {
            const contract = editorSlotContractFromComposition(pComp.data);
            if (contract.slots.length > 0) {
              const vs = validateEditorSlotValues(
                contract,
                base.templateSlotValues as Record<string, unknown> | undefined,
              );
              if (!vs.ok) {
                throw new APIError(vs.error, 400);
              }
            }
          }
        }
      }
    }

    return next;
  };
}

export function createComponentDefinitionBeforeValidateHandler(): CollectionBeforeValidateHook {
  return ({ data }) => {
    if (!data) {
      return data;
    }

    const row = data as {
      propContract?: unknown;
      slotContract?: unknown;
      composition?: unknown;
    };

    const p = PropContractSchema.safeParse(row.propContract);
    if (!p.success) {
      throw new APIError("Invalid propContract", 400);
    }

    const hasComposition =
      row.composition !== undefined && row.composition !== null;

    if (hasComposition) {
      const comp = PageCompositionSchema.safeParse(row.composition);
      if (!comp.success) {
        throw new APIError("Invalid composition template", 400);
      }
      const inv = validatePageCompositionInvariants(comp.data);
      if (!inv.ok) {
        throw new APIError(inv.error, 400);
      }
      return {
        ...data,
        propContract: p.data,
        composition: comp.data,
        slotContract: editorSlotContractFromComposition(comp.data),
      };
    }

    const s = parseEditorSlotContract(row.slotContract);
    if (!s.ok) {
      throw new APIError("Invalid slotContract", 400);
    }

    return {
      ...data,
      propContract: p.data,
      slotContract: s.data,
    };
  };
}

export function createComponentRevisionBeforeValidateHandler(): CollectionBeforeValidateHook {
  return ({ data }) => {
    if (!data) {
      return data;
    }

    const row = data as {
      propContract?: unknown;
      slotContract?: unknown;
      composition?: unknown;
    };

    let next = { ...data } as Record<string, unknown>;

    if (row.propContract !== undefined) {
      const p = PropContractSchema.safeParse(row.propContract);
      if (!p.success) {
        throw new APIError("Invalid propContract", 400);
      }
      next = { ...next, propContract: p.data };
    }

    if (row.composition !== undefined && row.composition !== null) {
      const comp = PageCompositionSchema.safeParse(row.composition);
      if (!comp.success) {
        throw new APIError("Invalid composition", 400);
      }
      const inv = validatePageCompositionInvariants(comp.data);
      if (!inv.ok) {
        throw new APIError(inv.error, 400);
      }
      next = {
        ...next,
        composition: comp.data,
        slotContract: editorSlotContractFromComposition(comp.data),
      };
    } else if (row.slotContract !== undefined) {
      const s = parseEditorSlotContract(row.slotContract);
      if (!s.ok) {
        throw new APIError("Invalid slotContract", 400);
      }
      next = { ...next, slotContract: s.data };
    }

    return next;
  };
}
