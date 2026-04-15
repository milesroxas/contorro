"use client";

/**
 * Keeps `contentSlots` rows in sync with the selected page template: one region per layout slot,
 * blocks preserved by slot id. Editors do not add/remove regions manually.
 *
 * Composes Payload’s {@link ArrayField} — https://payloadcms.com/docs/fields/array#custom-components
 */
import {
  ArrayField,
  useDocumentForm,
  useDocumentInfo,
  useForm,
  useFormFields,
  useFormInitializing,
  useFormModified,
} from "@payloadcms/ui";
import { PageCompositionSchema } from "@repo/contracts-zod";
import {
  DEFAULT_LAYOUT_SLOT_ID,
  mergePageContentSlotsToSlotOrder,
  orderedLayoutSlotIds,
} from "@repo/domains-composition";
import type { ArrayFieldClientComponent, FormState } from "payload";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { contentSlotsArrayFromDocumentLike } from "@/lib/page-content-slots-form";
import {
  extractPageCompositionId,
  pageCompositionFromDocumentData,
  pageCompositionLooseFromFields,
  parseEmbeddedPageComposition,
} from "./page-composition-form-state";

type FormFieldsTuple = [FormState, (action: never) => void];

function isPresentRelationshipValue(v: unknown): boolean {
  return v !== undefined && v !== null && v !== "";
}

function readPath(
  ctx: { getDataByPath?: (p: string) => unknown } | undefined,
  p: string,
): unknown {
  if (!ctx?.getDataByPath) {
    return undefined;
  }
  try {
    return ctx.getDataByPath(p);
  } catch {
    return undefined;
  }
}

function setValueAtPath(
  data: Record<string, unknown>,
  dottedPath: string,
  value: unknown,
): Record<string, unknown> {
  const segments = dottedPath.split(".").filter(Boolean);
  if (segments.length === 0) {
    return data;
  }
  const out = { ...data };
  let cur: Record<string, unknown> = out;
  for (let i = 0; i < segments.length - 1; i++) {
    const key = segments[i];
    const next = cur[key];
    const nested =
      next !== null && typeof next === "object" && !Array.isArray(next)
        ? { ...(next as Record<string, unknown>) }
        : {};
    cur[key] = nested;
    cur = nested;
  }
  cur[segments[segments.length - 1]] = value;
  return out;
}

type FormWithReset = {
  reset?: (data: Record<string, unknown>) => Promise<void>;
  getData?: () => Record<string, unknown>;
  getDataByPath?: (p: string) => unknown;
  setModified?: (modified: boolean) => void;
};

/** Raw array rows include Payload metadata (`id`, etc.); compare only template slot order vs row `slotId`s. */
function trimSlotId(raw: unknown): string {
  if (typeof raw !== "string" || raw.trim() === "") {
    return DEFAULT_LAYOUT_SLOT_ID;
  }
  return raw.trim();
}

function contentSlotsStructureMatchesTemplate(
  slotOrder: string[],
  rawSlots: unknown,
): boolean {
  if (!Array.isArray(rawSlots)) {
    return slotOrder.length === 0;
  }
  const rows = rawSlots as { slotId?: unknown }[];
  if (rows.length !== slotOrder.length) {
    return false;
  }
  for (let i = 0; i < slotOrder.length; i++) {
    if (trimSlotId(rows[i]?.slotId) !== slotOrder[i]) {
      return false;
    }
  }
  return true;
}

function pageCompositionFromSiblingFormPaths(
  documentForm: FormWithReset,
  form: FormWithReset,
): unknown {
  for (const c of [documentForm, form]) {
    for (const p of ["version.pageComposition", "pageComposition"]) {
      const v = readPath(c, p);
      if (isPresentRelationshipValue(v)) {
        return v;
      }
    }
  }
  return undefined;
}

function resolvePageCompositionRelationshipRef(
  fields: FormState,
  documentForm: FormWithReset,
  form: FormWithReset,
  savedDocumentData: unknown,
): unknown {
  let raw = pageCompositionLooseFromFields(fields);
  if (!isPresentRelationshipValue(raw)) {
    raw = pageCompositionFromSiblingFormPaths(documentForm, form);
  }
  if (!isPresentRelationshipValue(raw)) {
    const getDataFn =
      typeof documentForm?.getData === "function"
        ? documentForm.getData
        : typeof form?.getData === "function"
          ? form.getData
          : undefined;
    if (typeof getDataFn === "function") {
      raw = pageCompositionFromDocumentData(getDataFn());
    }
  }
  if (!isPresentRelationshipValue(raw)) {
    raw = pageCompositionFromDocumentData(savedDocumentData);
  }
  return raw;
}

function contentSlotsValueFromForms(
  documentForm: FormWithReset | undefined,
  form: FormWithReset | undefined,
  path: string,
  fullData: Record<string, unknown>,
): unknown {
  const current: unknown = contentSlotsArrayFromDocumentLike(fullData);
  if (current !== undefined) {
    return current;
  }
  for (const c of [documentForm, form]) {
    const v = readPath(c, path);
    if (v !== undefined) {
      return v;
    }
  }
  return undefined;
}

async function resyncMergedContentSlotsToTemplateOrder(
  slotIds: string[],
  path: string,
  documentForm: FormWithReset | undefined,
  form: FormWithReset | undefined,
  modifiedRef: { current: boolean },
  isCancelled: () => boolean,
): Promise<void> {
  const doc = documentForm;
  const frm = form;
  const rootForm =
    typeof doc?.reset === "function" && typeof doc?.getData === "function"
      ? doc
      : frm;
  const resetForm = rootForm?.reset;
  const getFormData = rootForm?.getData;
  if (
    rootForm === undefined ||
    typeof resetForm !== "function" ||
    typeof getFormData !== "function"
  ) {
    return;
  }

  const fullData = getFormData() as Record<string, unknown>;
  const current = contentSlotsValueFromForms(doc, frm, path, fullData);
  if (contentSlotsStructureMatchesTemplate(slotIds, current)) {
    return;
  }
  const next = mergePageContentSlotsToSlotOrder(slotIds, current);
  const wasModified = modifiedRef.current;
  const data = getFormData() as Record<string, unknown>;
  const baseMerged = setValueAtPath(data, path, next);
  const hadVersionSlots =
    fullData.version !== null &&
    typeof fullData.version === "object" &&
    Array.isArray(
      (fullData.version as { contentSlots?: unknown }).contentSlots,
    );
  const hadTopSlots = Array.isArray(fullData.contentSlots);
  const merged = mirrorContentSlotsOnVersionPaths(
    baseMerged,
    path,
    next,
    hadVersionSlots,
    hadTopSlots,
  );
  if (isCancelled()) {
    return;
  }
  await resetForm(merged);
  if (wasModified && typeof rootForm.setModified === "function") {
    rootForm.setModified(true);
  }
}

function mirrorContentSlotsOnVersionPaths(
  merged: Record<string, unknown>,
  path: string,
  next: ReturnType<typeof mergePageContentSlotsToSlotOrder>,
  hadVersionSlots: boolean,
  hadTopSlots: boolean,
): Record<string, unknown> {
  if (hadVersionSlots && hadTopSlots) {
    if (path === "contentSlots") {
      return setValueAtPath(merged, "version.contentSlots", next);
    }
    if (path === "version.contentSlots") {
      return setValueAtPath(merged, "contentSlots", next);
    }
    return merged;
  }
  if (hadVersionSlots && path === "contentSlots") {
    return setValueAtPath(merged, "version.contentSlots", next);
  }
  if (hadTopSlots && path === "version.contentSlots") {
    return setValueAtPath(merged, "contentSlots", next);
  }
  return merged;
}

async function fetchLayoutSlotOrderForComposition(
  compositionId: number,
): Promise<string[]> {
  try {
    const res = await fetch(`/api/page-compositions/${compositionId}?depth=0`, {
      credentials: "include",
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const json = (await res.json()) as Record<string, unknown>;
    const doc =
      json.doc !== undefined &&
      json.doc !== null &&
      typeof json.doc === "object" &&
      !Array.isArray(json.doc)
        ? (json.doc as { composition?: unknown })
        : (json as { composition?: unknown });
    const raw = doc.composition;
    const parsed = PageCompositionSchema.safeParse(raw);
    if (!parsed.success) {
      return ["main"];
    }
    const ids = orderedLayoutSlotIds(parsed.data);
    return ids.length > 0 ? ids : ["main"];
  } catch {
    return ["main"];
  }
}

const PageContentSlotsField: ArrayFieldClientComponent = (props) => {
  const { path, schemaPath, field, readOnly } = props;
  const resolvedSchemaPath = schemaPath ?? field.name;
  const form = useForm() as FormWithReset;
  const documentForm = useDocumentForm() as FormWithReset;
  const { data: savedDocumentData } = useDocumentInfo();
  const initializing = useFormInitializing();
  const modified = useFormModified();
  const modifiedRef = useRef(modified);
  modifiedRef.current = modified;

  const compositionRef = useFormFields(
    useCallback(
      (ctx: unknown) => {
        const [fields] = ctx as FormFieldsTuple;
        return resolvePageCompositionRelationshipRef(
          fields,
          documentForm,
          form,
          savedDocumentData,
        );
      },
      [documentForm, form, savedDocumentData],
    ),
  );

  const compositionId = useMemo(
    () => extractPageCompositionId(compositionRef),
    [compositionRef],
  );

  const embedded = useMemo(
    () => parseEmbeddedPageComposition(compositionRef),
    [compositionRef],
  );

  const embeddedSlotIds = useMemo((): string[] | null => {
    if (embedded === null) {
      return null;
    }
    const ids = orderedLayoutSlotIds(embedded);
    return ids.length > 0 ? ids : ["main"];
  }, [embedded]);

  const [slotIds, setSlotIds] = useState<string[] | null>(null);

  useEffect(() => {
    if (embeddedSlotIds !== null) {
      setSlotIds(embeddedSlotIds);
      return;
    }

    if (compositionId === undefined) {
      setSlotIds(["main"]);
      return;
    }

    let cancelled = false;
    setSlotIds(null);

    void (async () => {
      const ids = await fetchLayoutSlotOrderForComposition(compositionId);
      if (!cancelled) {
        setSlotIds(ids);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [embeddedSlotIds, compositionId]);

  const documentFormRef = useRef(documentForm);
  documentFormRef.current = documentForm;
  const formRef = useRef(form);
  formRef.current = form;

  useEffect(() => {
    if (readOnly || slotIds === null || initializing) {
      return;
    }

    let cancelled = false;
    void (async () => {
      await resyncMergedContentSlotsToTemplateOrder(
        slotIds,
        path,
        documentFormRef.current,
        formRef.current,
        modifiedRef,
        () => cancelled,
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [slotIds, readOnly, path, initializing]);

  return <ArrayField {...props} schemaPath={resolvedSchemaPath} />;
};

export default PageContentSlotsField;
