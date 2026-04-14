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
      // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complexity cleanup backlog.
      (ctx: unknown) => {
        const [fields] = ctx as FormFieldsTuple;
        let raw = pageCompositionLooseFromFields(fields);
        if (!isPresentRelationshipValue(raw)) {
          for (const c of [documentForm, form]) {
            for (const p of ["version.pageComposition", "pageComposition"]) {
              const v = readPath(c, p);
              if (isPresentRelationshipValue(v)) {
                raw = v;
                break;
              }
            }
            if (isPresentRelationshipValue(raw)) {
              break;
            }
          }
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

    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complexity cleanup backlog.
    void (async () => {
      try {
        const res = await fetch(
          `/api/page-compositions/${compositionId}?depth=0`,
          { credentials: "include" },
        );
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
        if (cancelled) {
          return;
        }
        if (!parsed.success) {
          setSlotIds(["main"]);
          return;
        }
        const ids = orderedLayoutSlotIds(parsed.data);
        setSlotIds(ids.length > 0 ? ids : ["main"]);
      } catch {
        if (!cancelled) {
          setSlotIds(["main"]);
        }
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
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complexity cleanup backlog.
    void (async () => {
      const doc = documentFormRef.current;
      const frm = formRef.current;
      const rootForm =
        typeof doc?.reset === "function" && typeof doc?.getData === "function"
          ? doc
          : frm;
      const resetForm = rootForm.reset;
      const getFormData = rootForm.getData;
      if (
        typeof resetForm !== "function" ||
        typeof getFormData !== "function"
      ) {
        return;
      }

      const fullData = getFormData() as Record<string, unknown>;
      let current: unknown = contentSlotsArrayFromDocumentLike(fullData);
      if (current === undefined) {
        for (const c of [doc, frm]) {
          const v = readPath(c, path);
          if (v !== undefined) {
            current = v;
            break;
          }
        }
      }
      if (contentSlotsStructureMatchesTemplate(slotIds, current)) {
        return;
      }
      const next = mergePageContentSlotsToSlotOrder(slotIds, current);
      const wasModified = modifiedRef.current;
      const data = getFormData() as Record<string, unknown>;
      let merged = setValueAtPath(data, path, next);
      const hadVersionSlots =
        fullData.version !== null &&
        typeof fullData.version === "object" &&
        Array.isArray(
          (fullData.version as { contentSlots?: unknown }).contentSlots,
        );
      const hadTopSlots = Array.isArray(fullData.contentSlots);
      if (hadVersionSlots && hadTopSlots) {
        if (path === "contentSlots") {
          merged = setValueAtPath(merged, "version.contentSlots", next);
        } else if (path === "version.contentSlots") {
          merged = setValueAtPath(merged, "contentSlots", next);
        }
      } else if (hadVersionSlots && path === "contentSlots") {
        merged = setValueAtPath(merged, "version.contentSlots", next);
      } else if (hadTopSlots && path === "version.contentSlots") {
        merged = setValueAtPath(merged, "contentSlots", next);
      }
      if (cancelled) {
        return;
      }
      await resetForm(merged);
      if (wasModified && typeof rootForm.setModified === "function") {
        rootForm.setModified(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [slotIds, readOnly, path, initializing]);

  return <ArrayField {...props} schemaPath={resolvedSchemaPath} />;
};

export default PageContentSlotsField;
