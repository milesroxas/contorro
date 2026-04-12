import {
  PageCompositionSchema,
  PropContractSchema,
  parseEditorFieldsContract,
} from "@repo/contracts-zod";
import {
  editorFieldsContractFromComposition,
  orderedLayoutSlotIds,
  resolveEditorFieldsContractForDefinition,
  validateEditorFieldValues,
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
     * false-negative “template vs blocks” or editor-field checks when unrelated fields change.
     * @see https://payloadcms.com/docs/hooks/collections — beforeValidate `originalDoc`
     */
    const base: Record<string, unknown> =
      operation === "update" &&
      originalDoc !== undefined &&
      originalDoc !== null &&
      typeof originalDoc === "object"
        ? { ...(originalDoc as Record<string, unknown>), ...next }
        : next;

    let effectiveContent: unknown = base.content;
    const pcForSlots = base.pageComposition;
    if (
      Array.isArray(base.content) &&
      base.content.length > 0 &&
      pcForSlots !== undefined &&
      pcForSlots !== null &&
      pcForSlots !== ""
    ) {
      const pcId = relationshipId(pcForSlots);
      if (pcId !== undefined) {
        const pDoc = await req.payload.findByID({
          collection: "page-compositions",
          id: pcId,
          depth: 0,
        });
        const rawComp = pDoc?.composition;
        if (rawComp !== undefined && rawComp !== null) {
          const parsed = PageCompositionSchema.safeParse(rawComp);
          if (parsed.success) {
            const slots = orderedLayoutSlotIds(parsed.data);
            if (slots.length === 1) {
              const only = slots[0];
              const normalized = (
                base.content as Record<string, unknown>[]
              ).map((row) => ({
                ...row,
                layoutSlotId: only,
              }));
              next.content = normalized;
              effectiveContent = normalized;
            }
          }
        }
      }
    }

    const rawContent = effectiveContent;
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
        editorFieldValues?: unknown;
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
          collection: "components",
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

        const resolved = resolveEditorFieldsContractForDefinition({
          composition: doc.composition,
          editorFields: (doc as { editorFields?: unknown }).editorFields,
        });
        if (!resolved.ok) {
          throw new APIError(
            "Invalid editor fields manifest on definition.",
            400,
          );
        }
        const vs = validateEditorFieldValues(
          resolved.contract,
          block.editorFieldValues as Record<string, unknown> | undefined,
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
            const contract = editorFieldsContractFromComposition(pComp.data);
            if (contract.editorFields.length > 0) {
              const vs = validateEditorFieldValues(
                contract,
                base.templateEditorFields as
                  | Record<string, unknown>
                  | undefined,
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

export function createComponentsBeforeValidateHandler(): CollectionBeforeValidateHook {
  return ({ data, operation, originalDoc }) => {
    if (!data) {
      return data;
    }

    const merged: Record<string, unknown> =
      operation === "update" &&
      originalDoc !== undefined &&
      originalDoc !== null &&
      typeof originalDoc === "object"
        ? { ...(originalDoc as Record<string, unknown>), ...data }
        : { ...(data as Record<string, unknown>) };

    const row = merged as {
      propContract?: unknown;
      editorFields?: unknown;
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
        editorFields: editorFieldsContractFromComposition(comp.data),
      };
    }

    const s = parseEditorFieldsContract(row.editorFields);
    if (!s.ok) {
      throw new APIError("Invalid editorFields", 400);
    }

    return {
      ...data,
      propContract: p.data,
      editorFields: s.data,
    };
  };
}
