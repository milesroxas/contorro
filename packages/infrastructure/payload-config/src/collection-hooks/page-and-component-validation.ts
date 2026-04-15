import {
  PageCompositionSchema,
  PropContractSchema,
  parseEditorFieldsContract,
} from "@repo/contracts-zod";
import {
  editorFieldsContractFromComposition,
  mergePageContentSlotsToSlotOrder,
  orderedLayoutSlotIds,
  resolveEditorFieldsContractForDefinition,
  validateEditorFieldValues,
  validatePageCompositionInvariants,
} from "@repo/domains-composition";
import type { CollectionBeforeValidateHook } from "payload";
import { APIError } from "payload";

import {
  ensureUniqueComponentKey,
  slugifyComponentKeyFromTitle,
} from "../utils/component-key-from-title.js";

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

const DEFAULT_SLOT_ORDER = ["main"] as const;

function normalizePageCompositionDraft(
  data: object,
  operation: "create" | "update" | "delete" | undefined,
  originalDoc: unknown,
): Record<string, unknown> {
  const next = { ...(data as Record<string, unknown>) };
  if (typeof next.title === "string") {
    next.title = next.title.trim();
  }
  if (typeof next.slug === "string") {
    next.slug = next.slug.trim();
  }
  if (
    (next.slug === undefined || next.slug === null || next.slug === "") &&
    operation === "update" &&
    originalDoc &&
    typeof originalDoc === "object" &&
    typeof (originalDoc as { slug?: unknown }).slug === "string"
  ) {
    next.slug = (originalDoc as { slug: string }).slug;
  }
  if (next.slug === undefined || next.slug === null || next.slug === "") {
    next.slug = `template-${crypto.randomUUID().slice(0, 12)}`;
  }

  const merged: Record<string, unknown> =
    operation === "update" &&
    originalDoc !== undefined &&
    originalDoc !== null &&
    typeof originalDoc === "object"
      ? { ...(originalDoc as Record<string, unknown>), ...next }
      : next;

  const raw = (merged as { composition?: unknown }).composition;
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
    ...next,
    composition: parsed.data,
  };
}

export function createPageCompositionBeforeValidateHandler(): CollectionBeforeValidateHook {
  return ({ data, operation, originalDoc }) => {
    if (!data || typeof data !== "object") {
      return data;
    }
    return normalizePageCompositionDraft(data, operation, originalDoc);
  };
}

type PayloadReq = Parameters<CollectionBeforeValidateHook>[0] extends {
  req: infer R;
}
  ? R
  : never;

async function layoutSlotOrderForPageRelationship(
  req: PayloadReq,
  pageComposition: unknown,
): Promise<string[]> {
  const defaultOrder = [...DEFAULT_SLOT_ORDER];
  const hasComposition =
    pageComposition !== undefined &&
    pageComposition !== null &&
    pageComposition !== "";
  if (!hasComposition) {
    return defaultOrder;
  }
  const pcId = relationshipId(pageComposition);
  if (pcId === undefined) {
    return defaultOrder;
  }
  const pDoc = await req.payload.findByID({
    collection: "page-compositions",
    id: pcId,
    depth: 0,
    user: req.user,
    overrideAccess: !req.user,
  });
  const rawComp = pDoc?.composition;
  if (rawComp === undefined || rawComp === null) {
    return defaultOrder;
  }
  const parsed = PageCompositionSchema.safeParse(rawComp);
  if (!parsed.success) {
    return defaultOrder;
  }
  const slots = orderedLayoutSlotIds(parsed.data);
  return slots.length > 0 ? slots : defaultOrder;
}

async function validateDesignerBlockEditorValues(
  req: PayloadReq,
  block: { componentDefinition?: unknown; editorFieldValues?: unknown },
): Promise<void> {
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
    throw new APIError("Designer block: missing component definition.", 400);
  }

  const doc = await req.payload.findByID({
    collection: "components",
    id: defId,
    depth: 0,
    user: req.user,
    overrideAccess: !req.user,
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
    throw new APIError("Invalid editor fields manifest on definition.", 400);
  }
  const vs = validateEditorFieldValues(
    resolved.contract,
    block.editorFieldValues as Record<string, unknown> | undefined,
  );
  if (!vs.ok) {
    throw new APIError(vs.error, 400);
  }
}

async function validateTemplateEditorFieldsAgainstComposition(
  req: PayloadReq,
  pageComposition: unknown,
  templateEditorFields: Record<string, unknown> | undefined,
): Promise<void> {
  const pcId = relationshipId(pageComposition);
  if (pcId === undefined) {
    return;
  }
  const pDoc = await req.payload.findByID({
    collection: "page-compositions",
    id: pcId,
    depth: 0,
    user: req.user,
    overrideAccess: !req.user,
  });
  if (!pDoc?.composition) {
    return;
  }
  const pComp = PageCompositionSchema.safeParse(pDoc.composition);
  if (!pComp.success) {
    return;
  }
  const contract = editorFieldsContractFromComposition(pComp.data);
  if (contract.editorFields.length === 0) {
    return;
  }
  const vs = validateEditorFieldValues(contract, templateEditorFields);
  if (!vs.ok) {
    throw new APIError(vs.error, 400);
  }
}

async function validateAndNormalizePageContent(
  req: PayloadReq,
  base: Record<string, unknown>,
): Promise<{
  normalizedSlots: ReturnType<typeof mergePageContentSlotsToSlotOrder>;
}> {
  const pc = base.pageComposition;
  const hasComposition = pc !== undefined && pc !== null && pc !== "";

  const slotOrder = await layoutSlotOrderForPageRelationship(req, pc);

  const normalizedSlots = mergePageContentSlotsToSlotOrder(
    slotOrder,
    base.contentSlots,
  );

  const hasBlocks = normalizedSlots.some(
    (row) => Array.isArray(row.blocks) && row.blocks.length > 0,
  );

  if (!hasBlocks && !hasComposition) {
    throw new APIError(
      "Set either a page template or at least one designer block.",
      400,
    );
  }

  if (hasBlocks) {
    for (const slot of normalizedSlots) {
      for (const block of slot.blocks) {
        await validateDesignerBlockEditorValues(req, block);
      }
    }
  }

  if (hasComposition) {
    await validateTemplateEditorFieldsAgainstComposition(
      req,
      pc,
      base.templateEditorFields as Record<string, unknown> | undefined,
    );
  }

  return { normalizedSlots };
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

    const { normalizedSlots } = await validateAndNormalizePageContent(
      req,
      base,
    );
    next.contentSlots = normalizedSlots;
    return next;
  };
}

async function assignComponentDocumentKey(
  next: Record<string, unknown>,
  operation: string | undefined,
  originalDoc: unknown,
  req: PayloadReq,
): Promise<void> {
  if (
    operation === "update" &&
    originalDoc &&
    typeof originalDoc === "object"
  ) {
    const prevKey = (originalDoc as { key?: unknown }).key;
    if (typeof prevKey === "string") {
      next.key = prevKey;
    }
    return;
  }
  if (operation !== "create") {
    return;
  }
  const explicit = typeof next.key === "string" ? next.key.trim() : "";
  if (explicit.startsWith("primitive.")) {
    next.key = explicit;
    return;
  }
  const title = typeof next.displayName === "string" ? next.displayName : "";
  if (title === "") {
    throw new APIError("Title is required", 400);
  }
  const base = slugifyComponentKeyFromTitle(title);
  next.key = await ensureUniqueComponentKey(req.payload, base);
}

function validateComponentPayloadShape(
  next: Record<string, unknown>,
  merged: Record<string, unknown>,
): Record<string, unknown> {
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
      ...next,
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
    ...next,
    propContract: p.data,
    editorFields: s.data,
  };
}

export function createComponentsBeforeValidateHandler(): CollectionBeforeValidateHook {
  return async ({ data, operation, originalDoc, req }) => {
    if (!data) {
      return data;
    }

    const next = { ...(data as Record<string, unknown>) };
    if (typeof next.displayName === "string") {
      next.displayName = next.displayName.trim();
    }

    await assignComponentDocumentKey(next, operation, originalDoc, req);

    const merged: Record<string, unknown> =
      operation === "update" &&
      originalDoc !== undefined &&
      originalDoc !== null &&
      typeof originalDoc === "object"
        ? { ...(originalDoc as Record<string, unknown>), ...next }
        : next;

    return validateComponentPayloadShape(next, merged);
  };
}
