import {
  blockCatalogEntry,
  type PageComposition,
  PageCompositionSchema,
} from "@repo/contracts-zod";
import {
  defaultEmptyPageComposition,
  defaultPageTemplateComposition,
  mergePageContentSlotsToSlotOrder,
  orderedLayoutSlotIds,
  validatePageCompositionInvariants,
} from "@repo/domains-composition";
import type { CollectionBeforeValidateHook } from "payload";
import { APIError } from "payload";

import {
  ensureUniqueComponentKey,
  slugifyComponentKeyFromTitle,
} from "../utils/component-key-from-title.js";

/**
 * Payload passes partial `data` on update; hooks validate against the merged
 * view so unrelated field changes never false-negative content checks.
 * @see https://payloadcms.com/docs/hooks/collections — beforeValidate `originalDoc`
 */
function mergedRowView(
  next: Record<string, unknown>,
  operation: "create" | "update" | "delete" | undefined,
  originalDoc: unknown,
): Record<string, unknown> {
  return operation === "update" &&
    originalDoc !== undefined &&
    originalDoc !== null &&
    typeof originalDoc === "object"
    ? { ...(originalDoc as Record<string, unknown>), ...next }
    : next;
}

function trimStringField(next: Record<string, unknown>, key: string): void {
  if (typeof next[key] === "string") {
    next[key] = (next[key] as string).trim();
  }
}

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

function parseCompositionOrThrow(raw: unknown): PageComposition {
  const parsed = PageCompositionSchema.safeParse(raw);
  if (!parsed.success) {
    throw new APIError("Invalid page composition shape", 400);
  }
  const inv = validatePageCompositionInvariants(parsed.data);
  if (!inv.ok) {
    throw new APIError(inv.error, 400);
  }
  return parsed.data;
}

function normalizePageCompositionDraft(
  data: object,
  operation: "create" | "update" | "delete" | undefined,
  originalDoc: unknown,
): Record<string, unknown> {
  const next = { ...(data as Record<string, unknown>) };
  trimStringField(next, "title");
  trimStringField(next, "slug");
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

  const merged = mergedRowView(next, operation, originalDoc);

  let raw = (merged as { composition?: unknown }).composition;
  if (raw === undefined || raw === null) {
    if (operation !== "create") {
      throw new APIError("Composition is required", 400);
    }
    // Admin “Create New” sends no composition; default a valid shell that
    // opens in Studio instead of rejecting the create.
    raw = defaultPageTemplateComposition();
  }

  return {
    ...next,
    composition: parseCompositionOrThrow(raw),
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

/**
 * Slot order for the page’s selected template.
 *
 * - `{ order }` — template resolved (or no template → default order).
 * - `null` — the template exists but could not be read/parsed; the caller must
 *   leave `contentSlots` untouched instead of rewriting rows (audit §1.6).
 */
async function layoutSlotOrderForPageRelationship(
  req: PayloadReq,
  pageComposition: unknown,
): Promise<{ order: string[] } | null> {
  const defaultOrder = [...DEFAULT_SLOT_ORDER];
  const hasComposition =
    pageComposition !== undefined &&
    pageComposition !== null &&
    pageComposition !== "";
  if (!hasComposition) {
    return { order: defaultOrder };
  }
  const pcId = relationshipId(pageComposition);
  if (pcId === undefined) {
    return null;
  }
  let rawComp: unknown;
  try {
    const pDoc = await req.payload.findByID({
      collection: "page-compositions",
      id: pcId,
      depth: 0,
      req,
      user: req.user,
      overrideAccess: !req.user,
    });
    rawComp = pDoc?.composition;
  } catch {
    return null;
  }
  if (rawComp === undefined || rawComp === null) {
    return null;
  }
  const parsed = PageCompositionSchema.safeParse(rawComp);
  if (!parsed.success) {
    return null;
  }
  const slots = orderedLayoutSlotIds(parsed.data);
  return { order: slots.length > 0 ? slots : defaultOrder };
}

function contentSlotsHaveBlocks(contentSlots: unknown): boolean {
  return (
    Array.isArray(contentSlots) &&
    contentSlots.some(
      (row) =>
        row !== null &&
        typeof row === "object" &&
        Array.isArray((row as { blocks?: unknown }).blocks) &&
        (row as { blocks: unknown[] }).blocks.length > 0,
    )
  );
}

/**
 * Publish-time page content rule. Block field values (required fields
 * included) are native Payload fields now — Payload skips them on draft save
 * and enforces them on publish. Only the page-level “has any content” rule
 * stays, publish-time only.
 */
function assertPublishablePageContent(
  base: Record<string, unknown>,
  hasComposition: boolean,
  slots: unknown,
): void {
  if (base._status !== "published") {
    return;
  }
  if (!hasComposition && !contentSlotsHaveBlocks(slots)) {
    throw new APIError(
      "Set either a page template or at least one content block before publishing.",
      400,
    );
  }
}

export function createPagesBeforeValidateHandler(): CollectionBeforeValidateHook {
  return async ({ data, req, operation, originalDoc }) => {
    if (!data || typeof data !== "object") {
      return data;
    }
    const next = { ...data } as Record<string, unknown>;
    trimStringField(next, "slug");
    trimStringField(next, "title");

    const base = mergedRowView(next, operation, originalDoc);

    const pc = base.pageComposition;
    const hasComposition = pc !== undefined && pc !== null && pc !== "";

    const resolved = await layoutSlotOrderForPageRelationship(req, pc);
    if (resolved !== null) {
      // Align rows to the template’s slot order; blocks in removed regions are
      // preserved in the first region (never dropped — audit §1.6).
      next.contentSlots = mergePageContentSlotsToSlotOrder(
        resolved.order,
        base.contentSlots,
      );
    }
    // resolved === null → template unreadable: leave contentSlots untouched.

    assertPublishablePageContent(
      base,
      hasComposition,
      resolved !== null ? next.contentSlots : base.contentSlots,
    );

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
  if (explicit !== "") {
    next.key = explicit;
    return;
  }
  const title = typeof next.displayName === "string" ? next.displayName : "";
  if (title === "") {
    throw new APIError("Title is required", 400);
  }
  const base = slugifyComponentKeyFromTitle(title);
  next.key = await ensureUniqueComponentKey(req, base);
}

/**
 * Publish gate: a design that declares a `blockType` must bind exactly the
 * catalog contract — every required field bound once, no unknown or duplicate
 * binding names. Empty `blockType` = design-only, bindings not validated.
 */
function editorBindingCounts(
  composition: PageComposition,
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const node of Object.values(composition.nodes)) {
    const cb = node.contentBinding;
    if (cb?.source !== "editor") {
      continue;
    }
    const name = cb.editorField?.name ?? cb.key;
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return counts;
}

function blockBindingProblems(
  blockType: string,
  entry: NonNullable<ReturnType<typeof blockCatalogEntry>>,
  bindingCounts: Map<string, number>,
): string[] {
  const problems: string[] = [];
  const catalogNames = new Set(entry.fields.map((f) => f.name));
  for (const [name, count] of bindingCounts) {
    if (!catalogNames.has(name)) {
      problems.push(
        `binding "${name}" is not a field of block type "${blockType}"`,
      );
    } else if (count > 1) {
      problems.push(`field "${name}" is bound ${count} times (max once)`);
    }
  }
  for (const field of entry.fields) {
    if (field.required && !bindingCounts.has(field.name)) {
      problems.push(`required field "${field.name}" is not bound`);
    }
  }
  return problems;
}

function validatePublishedBlockDesignBindings(
  blockType: string,
  composition: PageComposition,
): void {
  const entry = blockCatalogEntry(blockType);
  if (!entry) {
    throw new APIError(`Unknown block type "${blockType}"`, 400);
  }
  const problems = blockBindingProblems(
    blockType,
    entry,
    editorBindingCounts(composition),
  );
  if (problems.length > 0) {
    throw new APIError(
      `Design does not satisfy block type "${blockType}": ${problems.join("; ")}.`,
      400,
    );
  }
}

function normalizedBlockType(merged: Record<string, unknown>): string | null {
  return typeof merged.blockType === "string" && merged.blockType.trim() !== ""
    ? merged.blockType.trim()
    : null;
}

export function createComponentsBeforeValidateHandler(): CollectionBeforeValidateHook {
  return async ({ data, operation, originalDoc, req }) => {
    if (!data) {
      return data;
    }

    const next = { ...(data as Record<string, unknown>) };
    trimStringField(next, "displayName");

    await assignComponentDocumentKey(next, operation, originalDoc, req);

    const merged = mergedRowView(next, operation, originalDoc);

    // Admin “Create New” sends no composition; default a valid empty shell
    // that opens in Studio instead of rejecting the create.
    const rawComposition =
      merged.composition === undefined || merged.composition === null
        ? defaultEmptyPageComposition()
        : merged.composition;

    const composition = parseCompositionOrThrow(rawComposition);

    const blockType = normalizedBlockType(merged);
    if (merged._status === "published" && blockType !== null) {
      validatePublishedBlockDesignBindings(blockType, composition);
    }

    return {
      ...next,
      composition,
    };
  };
}
