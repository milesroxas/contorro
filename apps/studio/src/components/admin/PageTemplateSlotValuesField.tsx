"use client";

import { useDocumentInfo, useField } from "@payloadcms/ui";
import {
  useDocumentForm,
  useForm,
  useFormFields,
} from "@payloadcms/ui/forms/Form";
import {
  type PageComposition,
  PageCompositionSchema,
  type SlotDefinition,
} from "@repo/contracts-zod";
import { slotDefinitionsFromComposition } from "@repo/domains-composition";
import type { FormState, JSONFieldClientProps } from "payload";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Label } from "@/components/ui/label";

import { SlotValuesInputs } from "./SlotValuesInputs";

type FormFieldsTuple = [FormState, (action: never) => void];

function siblingPathForPageComposition(templateSlotValuesPath: string): string {
  if (!templateSlotValuesPath.endsWith("templateSlotValues")) {
    return templateSlotValuesPath;
  }
  const cut = "templateSlotValues".length;
  return `${templateSlotValuesPath.slice(0, -cut)}pageComposition`;
}

/** Pair `*.pageComposition` form keys with this field’s path (handles draft/version path skew). */
function pageCompositionFieldPairsTemplateSlotPath(
  pageCompositionFieldKey: string,
  templateSlotValuesPath: string,
): boolean {
  const expectedPair =
    pageCompositionFieldKey === "pageComposition"
      ? "templateSlotValues"
      : pageCompositionFieldKey.replace(
          /\.pageComposition$/,
          ".templateSlotValues",
        );
  if (expectedPair === templateSlotValuesPath) {
    return true;
  }
  // Drafts: Payload often keeps this JSON field at top-level `templateSlotValues` while
  // the relationship value only appears under `version.pageComposition` in form state.
  return (
    templateSlotValuesPath === "templateSlotValues" &&
    pageCompositionFieldKey === "version.pageComposition"
  );
}

function extractPageCompositionId(raw: unknown): number | undefined {
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return raw;
  }
  if (typeof raw === "string" && /^\d+$/.test(raw)) {
    return Number.parseInt(raw, 10);
  }
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    if ("id" in raw) {
      const id = (raw as { id: unknown }).id;
      if (typeof id === "number" && Number.isFinite(id)) {
        return id;
      }
      if (typeof id === "string" && /^\d+$/.test(id)) {
        return Number.parseInt(id, 10);
      }
    }
    if ("value" in raw) {
      return extractPageCompositionId((raw as { value: unknown }).value);
    }
  }
  return undefined;
}

/**
 * Resolves `pageComposition` for this `templateSlotValues` field. Drafts use
 * `version.pageComposition` / `version.templateSlotValues`; we pair keys explicitly
 * instead of taking the first `*.pageComposition` in the form (which can be wrong or empty).
 */
function pageCompositionValueFromFormState(
  templateSlotValuesPath: string,
  fields: FormState,
): unknown {
  const expectedKey = siblingPathForPageComposition(templateSlotValuesPath);
  const direct = fields[expectedKey]?.value as unknown;
  if (direct !== undefined && direct !== null && direct !== "") {
    return direct;
  }
  for (const key of Object.keys(fields)) {
    if (key !== "pageComposition" && !key.endsWith(".pageComposition")) {
      continue;
    }
    if (
      !pageCompositionFieldPairsTemplateSlotPath(key, templateSlotValuesPath)
    ) {
      continue;
    }
    const v = fields[key]?.value as unknown;
    if (v !== undefined && v !== null && v !== "") {
      return v;
    }
  }
  return undefined;
}

function isPresentRelationshipValue(v: unknown): boolean {
  return v !== undefined && v !== null && v !== "";
}

/** Last resort: any `*.pageComposition` row in form state (Payload key shape can vary by version/locale). */
function pageCompositionLooseFieldScan(fields: FormState): unknown {
  const keys = Object.keys(fields).filter(
    (k) => k === "pageComposition" || k.endsWith(".pageComposition"),
  );
  keys.sort((a, b) => {
    const rank = (x: string) =>
      x === "version.pageComposition" ? 0 : x === "pageComposition" ? 1 : 2;
    return rank(a) - rank(b);
  });
  for (const key of keys) {
    const v = fields[key]?.value as unknown;
    if (isPresentRelationshipValue(v)) {
      return v;
    }
  }
  return undefined;
}

function pageCompositionFromGetDataByPath(
  ctx: { getDataByPath?: (path: string) => unknown } | undefined,
): unknown {
  if (!ctx?.getDataByPath) {
    return undefined;
  }
  for (const p of ["pageComposition", "version.pageComposition"]) {
    try {
      const v = ctx.getDataByPath(p);
      if (isPresentRelationshipValue(v)) {
        return v;
      }
    } catch {
      /* invalid path */
    }
  }
  return undefined;
}

function resolvePageCompositionRef(args: {
  templateSlotValuesPath: string;
  fields: FormState;
  documentForm: { getDataByPath?: (path: string) => unknown } | undefined;
  form: { getDataByPath?: (path: string) => unknown } | undefined;
  getData: (() => unknown) | undefined;
  savedDocumentData: unknown;
}): unknown {
  const {
    templateSlotValuesPath,
    fields,
    documentForm,
    form,
    getData,
    savedDocumentData,
  } = args;
  let raw: unknown = pageCompositionValueFromFormState(
    templateSlotValuesPath,
    fields,
  );
  if (isPresentRelationshipValue(raw)) {
    return raw;
  }
  raw = pageCompositionFromGetDataByPath(documentForm);
  if (isPresentRelationshipValue(raw)) {
    return raw;
  }
  raw = pageCompositionFromGetDataByPath(form);
  if (isPresentRelationshipValue(raw)) {
    return raw;
  }
  if (typeof getData === "function") {
    raw = pageCompositionFromDocumentData(getData());
    if (isPresentRelationshipValue(raw)) {
      return raw;
    }
  }
  raw = pageCompositionFromDocumentData(savedDocumentData);
  if (isPresentRelationshipValue(raw)) {
    return raw;
  }
  return pageCompositionLooseFieldScan(fields);
}

function pageCompositionFromDocumentData(data: unknown): unknown {
  if (!data || typeof data !== "object") {
    return undefined;
  }
  const row = data as {
    pageComposition?: unknown;
    version?: { pageComposition?: unknown };
  };
  const top = row.pageComposition;
  if (top !== undefined && top !== null && top !== "") {
    return top;
  }
  const v = row.version?.pageComposition;
  if (v !== undefined && v !== null && v !== "") {
    return v;
  }
  return undefined;
}

/** When the relationship is populated (admin depth), the tree is already on the form — no REST round-trip. */
function parseEmbeddedPageComposition(raw: unknown): PageComposition | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }
  const comp = (raw as { composition?: unknown }).composition;
  if (comp === undefined || comp === null) {
    return null;
  }
  const parsed = PageCompositionSchema.safeParse(comp);
  return parsed.success ? parsed.data : null;
}

/** Slot fill-in for the selected page template (builder tree). */
function PageTemplateSlotValuesField(props: JSONFieldClientProps) {
  const { path, field } = props;

  const {
    value: rawValue,
    setValue,
    disabled,
    path: fieldPath,
  } = useField<Record<string, unknown>>({
    potentiallyStalePath: path,
  });

  const form = useForm();
  const documentForm = useDocumentForm();
  const { data: savedDocumentData } = useDocumentInfo();

  const value = rawValue;
  const slotMapRef = useRef<Record<string, unknown>>({});
  useEffect(() => {
    slotMapRef.current =
      value && typeof value === "object" && !Array.isArray(value)
        ? { ...(value as Record<string, unknown>) }
        : {};
  }, [value]);

  const compositionRef = useFormFields(
    useCallback(
      (ctx: unknown) => {
        const [fields] = ctx as FormFieldsTuple;
        const getDataFn =
          typeof documentForm?.getData === "function"
            ? documentForm.getData
            : typeof form?.getData === "function"
              ? form.getData
              : undefined;
        return resolvePageCompositionRef({
          templateSlotValuesPath: fieldPath,
          fields,
          documentForm,
          form,
          getData:
            typeof getDataFn === "function" ? () => getDataFn() : undefined,
          savedDocumentData,
        });
      },
      [fieldPath, documentForm, form, savedDocumentData],
    ),
  );

  const compositionId = useMemo(
    () => extractPageCompositionId(compositionRef),
    [compositionRef],
  );

  const embeddedTree = useMemo(
    () => parseEmbeddedPageComposition(compositionRef),
    [compositionRef],
  );

  const [loadError, setLoadError] = useState<string | null>(null);
  const [remoteSlots, setRemoteSlots] = useState<SlotDefinition[] | null>(null);

  useEffect(() => {
    if (embeddedTree !== null) {
      setRemoteSlots(null);
      setLoadError(null);
      return;
    }

    if (compositionId === undefined) {
      setRemoteSlots(null);
      setLoadError(null);
      return;
    }

    let cancelled = false;
    setLoadError(null);

    void (async () => {
      try {
        const res = await fetch(
          `/api/page-compositions/${compositionId}?depth=0`,
          { credentials: "include" },
        );
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const json = (await res.json()) as {
          doc?: { composition?: unknown };
        };
        const doc = json.doc ?? (json as { composition?: unknown });
        const raw = doc?.composition;
        const parsed = PageCompositionSchema.safeParse(raw);
        if (!cancelled) {
          if (!parsed.success) {
            setRemoteSlots([]);
            setLoadError("Invalid page template tree.");
            return;
          }
          setRemoteSlots(slotDefinitionsFromComposition(parsed.data));
          setLoadError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setRemoteSlots([]);
          setLoadError(
            e instanceof Error ? e.message : "Failed to load page template",
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [embeddedTree, compositionId]);

  const slots: SlotDefinition[] = useMemo(() => {
    if (embeddedTree !== null) {
      return slotDefinitionsFromComposition(embeddedTree);
    }
    return remoteSlots ?? [];
  }, [embeddedTree, remoteSlots]);

  const current = useMemo(() => {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return { ...(value as Record<string, unknown>) };
    }
    return {};
  }, [value]);

  const patchSlot = useCallback(
    (name: string, next: unknown) => {
      slotMapRef.current = { ...slotMapRef.current, [name]: next };
      setValue(slotMapRef.current);
    },
    [setValue],
  );

  const hasTemplate = embeddedTree !== null || compositionId !== undefined;

  if (!hasTemplate) {
    return (
      <p className="rounded-none border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        Select a page template above to edit its slots.
      </p>
    );
  }

  if (loadError) {
    return (
      <p className="rounded-none border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
        {loadError}
      </p>
    );
  }

  if (slots.length === 0) {
    return (
      <p className="rounded-none border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        This page template has no exposed slots yet. Mark nodes as slots in the
        builder.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {field?.label ? (
        <Label className="text-sm font-medium">{String(field.label)}</Label>
      ) : null}
      <SlotValuesInputs
        current={current}
        disabled={disabled}
        patchSlot={patchSlot}
        slots={slots}
      />
    </div>
  );
}

export default PageTemplateSlotValuesField;
