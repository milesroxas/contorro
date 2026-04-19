"use client";

import { useDocumentInfo, useField } from "@payloadcms/ui";
import {
  useDocumentForm,
  useForm,
  useFormFields,
} from "@payloadcms/ui/forms/Form";
import {
  type EditorFieldSpec,
  EditorFieldSpecSchema,
  type PageComposition,
  PageCompositionSchema,
} from "@repo/contracts-zod";
import { editorFieldSpecsFromComposition } from "@repo/domains-composition";
import type { FormState, JSONFieldClientProps } from "payload";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { EditorFieldsInputs } from "./EditorFieldsInputs";
import { extractPageCompositionId } from "./page-composition-form-state";

type FormFieldsTuple = [FormState, (action: never) => void];

function siblingPathForPageComposition(
  templateEditorFieldsPath: string,
): string {
  if (!templateEditorFieldsPath.endsWith("templateEditorFields")) {
    return templateEditorFieldsPath;
  }
  const cut = "templateEditorFields".length;
  return `${templateEditorFieldsPath.slice(0, -cut)}pageComposition`;
}

/** Pair `*.pageComposition` form keys with this field’s path (handles draft/version path skew). */
function pageCompositionFieldPairsTemplateEditorFieldsPath(
  pageCompositionFieldKey: string,
  templateEditorFieldsPath: string,
): boolean {
  const expectedPair =
    pageCompositionFieldKey === "pageComposition"
      ? "templateEditorFields"
      : pageCompositionFieldKey.replace(
          /\.pageComposition$/,
          ".templateEditorFields",
        );
  if (expectedPair === templateEditorFieldsPath) {
    return true;
  }
  // Drafts: Payload often keeps this JSON field at top-level `templateEditorFields` while
  // the relationship value only appears under `version.pageComposition` in form state.
  if (
    templateEditorFieldsPath === "templateEditorFields" &&
    pageCompositionFieldKey === "version.pageComposition"
  ) {
    return true;
  }
  // Inverse: relationship stays at top-level `pageComposition` while slot JSON is only under `version.templateEditorFields`.
  return (
    templateEditorFieldsPath === "version.templateEditorFields" &&
    pageCompositionFieldKey === "pageComposition"
  );
}

/**
 * Resolves `pageComposition` for this `templateEditorFields` field. Drafts use
 * `version.pageComposition` / `version.templateEditorFields`; we pair keys explicitly
 * instead of taking the first `*.pageComposition` in the form (which can be wrong or empty).
 */
function pageCompositionValueFromFormState(
  templateEditorFieldsPath: string,
  fields: FormState,
): unknown {
  const expectedKey = siblingPathForPageComposition(templateEditorFieldsPath);
  const direct = fields[expectedKey]?.value as unknown;
  if (direct !== undefined && direct !== null && direct !== "") {
    return direct;
  }
  for (const key of Object.keys(fields)) {
    if (key !== "pageComposition" && !key.endsWith(".pageComposition")) {
      continue;
    }
    if (
      !pageCompositionFieldPairsTemplateEditorFieldsPath(
        key,
        templateEditorFieldsPath,
      )
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
  for (const p of ["version.pageComposition", "pageComposition"]) {
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
  templateEditorFieldsPath: string;
  fields: FormState;
  documentForm: { getDataByPath?: (path: string) => unknown } | undefined;
  form: { getDataByPath?: (path: string) => unknown } | undefined;
  getData: (() => unknown) | undefined;
  savedDocumentData: unknown;
}): unknown {
  const {
    templateEditorFieldsPath,
    fields,
    documentForm,
    form,
    getData,
    savedDocumentData,
  } = args;
  let raw: unknown = pageCompositionValueFromFormState(
    templateEditorFieldsPath,
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

async function fetchEditorFieldSpecsForPageComposition(
  compositionId: number,
): Promise<
  { ok: true; fields: EditorFieldSpec[] } | { ok: false; message: string }
> {
  try {
    const res = await fetch(
      `/api/studio/page-template-editor-fields?compositionId=${compositionId}`,
      { credentials: "include" },
    );
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const json = (await res.json()) as {
      data?: { fields?: unknown };
    };
    const rawFields = json.data?.fields;
    if (!Array.isArray(rawFields)) {
      return { ok: false, message: "Invalid template editor fields response." };
    }
    const fields: EditorFieldSpec[] = [];
    for (const rawField of rawFields) {
      const parsedField = EditorFieldSpecSchema.safeParse(rawField);
      if (!parsedField.success) {
        return { ok: false, message: "Invalid editor field in response." };
      }
      fields.push(parsedField.data);
    }
    return {
      ok: true,
      fields,
    };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Failed to load page template",
    };
  }
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

/** Slot fill-in for the selected page template (Studio tree). */
function PageTemplateEditorFieldsField(props: JSONFieldClientProps) {
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
          templateEditorFieldsPath: fieldPath,
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
  const [remoteEditorFields, setRemoteEditorFields] = useState<
    EditorFieldSpec[] | null
  >(null);

  useEffect(() => {
    if (compositionId === undefined) {
      setRemoteEditorFields(null);
      setLoadError(null);
      return;
    }

    let cancelled = false;
    setLoadError(null);

    void (async () => {
      const result =
        await fetchEditorFieldSpecsForPageComposition(compositionId);
      if (cancelled) {
        return;
      }
      if (result.ok) {
        setRemoteEditorFields(result.fields);
        setLoadError(null);
      } else {
        setRemoteEditorFields([]);
        setLoadError(result.message);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [compositionId]);

  const editorFields: EditorFieldSpec[] = useMemo(() => {
    if (remoteEditorFields !== null) {
      return remoteEditorFields;
    }
    if (embeddedTree !== null) {
      return editorFieldSpecsFromComposition(embeddedTree);
    }
    return [];
  }, [embeddedTree, remoteEditorFields]);

  const current = useMemo(() => {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return { ...(value as Record<string, unknown>) };
    }
    return {};
  }, [value]);

  const patchField = useCallback(
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
        Select a page template above to edit CMS fields.
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

  if (editorFields.length === 0) {
    return (
      <p className="rounded-none border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        This page template has no CMS fields yet. In Studio, expose text (or
        other primitives) as editor-managed fields.
      </p>
    );
  }

  return (
    <div className="contorro-admin-custom-group">
      <p className="contorro-admin-custom-group__title">
        {field?.label ? String(field.label) : "Custom CMS fields"}
      </p>
      <div className="contorro-admin-custom-group__body">
        <EditorFieldsInputs
          current={current}
          disabled={disabled}
          fields={editorFields}
          patchField={patchField}
        />
      </div>
    </div>
  );
}

export default PageTemplateEditorFieldsField;
