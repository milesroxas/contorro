"use client";

import { useDocumentInfo, useField } from "@payloadcms/ui";
import {
  useDocumentForm,
  useForm,
  useFormFields,
} from "@payloadcms/ui/forms/Form";
import {
  type EditorFieldSpec,
  PageCompositionSchema,
  normalizeEditorFieldsContract,
} from "@repo/contracts-zod";
import { editorFieldSpecsFromComposition } from "@repo/domains-composition";
import type { FormState, JSONFieldClientProps } from "payload";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Label } from "@/components/ui/label";

import { EditorFieldsInputs } from "./EditorFieldsInputs";

type FormFieldsTuple = [FormState, (action: never) => void];

type ComponentDefinitionDoc = {
  id?: number;
  composition?: unknown;
  editorFields?: unknown;
};

function siblingPathForComponentDefinition(
  editorFieldValuesPath: string,
): string {
  if (!editorFieldValuesPath.endsWith("editorFieldValues")) {
    return editorFieldValuesPath;
  }
  const cut = "editorFieldValues".length;
  return `${editorFieldValuesPath.slice(0, -cut)}componentDefinition`;
}

function isPresentRelationshipValue(v: unknown): boolean {
  return v !== undefined && v !== null && v !== "";
}

/**
 * Pair `*.componentDefinition` form keys with this row’s `*.editorFieldValues` path (draft/version skew).
 */
function componentDefinitionFieldPairsEditorFieldValuesPath(
  componentDefinitionFieldKey: string,
  editorFieldValuesPath: string,
): boolean {
  const expectedSlotPath =
    componentDefinitionFieldKey === "componentDefinition"
      ? "editorFieldValues"
      : componentDefinitionFieldKey.replace(
          /\.componentDefinition$/,
          ".editorFieldValues",
        );
  if (expectedSlotPath === editorFieldValuesPath) {
    return true;
  }
  const mTop = /^content\.(\d+)\.editorFieldValues$/.exec(
    editorFieldValuesPath,
  );
  if (
    mTop &&
    componentDefinitionFieldKey ===
      `version.content.${mTop[1]}.componentDefinition`
  ) {
    return true;
  }
  const mVer = /^version\.content\.(\d+)\.editorFieldValues$/.exec(
    editorFieldValuesPath,
  );
  if (
    mVer &&
    componentDefinitionFieldKey === `content.${mVer[1]}.componentDefinition`
  ) {
    return true;
  }
  return false;
}

/**
 * Resolves `componentDefinition` for this `editorFieldValues` field. Drafts may split keys across
 * `content.N.*` and `version.content.N.*` (same idea as `PageTemplateEditorFieldsField`).
 */
function componentDefinitionValueFromFormState(
  editorFieldValuesPath: string,
  fields: FormState,
): unknown {
  const expectedKey = siblingPathForComponentDefinition(editorFieldValuesPath);
  const direct = fields[expectedKey]?.value as unknown;
  if (isPresentRelationshipValue(direct)) {
    return direct;
  }
  const keys = Object.keys(fields).filter(
    (k) => k === "componentDefinition" || k.endsWith(".componentDefinition"),
  );
  keys.sort((a, b) => {
    const rank = (x: string) => (x.startsWith("version.") ? 0 : 1);
    return rank(a) - rank(b);
  });
  for (const key of keys) {
    if (
      !componentDefinitionFieldPairsEditorFieldValuesPath(
        key,
        editorFieldValuesPath,
      )
    ) {
      continue;
    }
    const v = fields[key]?.value as unknown;
    if (isPresentRelationshipValue(v)) {
      return v;
    }
  }
  return undefined;
}

function componentDefinitionFromGetDataByPath(
  ctx: { getDataByPath?: (path: string) => unknown } | undefined,
  editorFieldValuesPath: string,
): unknown {
  if (!ctx?.getDataByPath) {
    return undefined;
  }
  const tryPaths: string[] = [
    siblingPathForComponentDefinition(editorFieldValuesPath),
  ];
  const mTop = /^content\.(\d+)\.editorFieldValues$/.exec(
    editorFieldValuesPath,
  );
  if (mTop) {
    tryPaths.push(`version.content.${mTop[1]}.componentDefinition`);
  }
  const mVer = /^version\.content\.(\d+)\.editorFieldValues$/.exec(
    editorFieldValuesPath,
  );
  if (mVer) {
    tryPaths.push(`content.${mVer[1]}.componentDefinition`);
  }
  for (const p of tryPaths) {
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

function componentDefinitionFromDocumentData(
  data: unknown,
  editorFieldValuesPath: string,
): unknown {
  if (!data || typeof data !== "object") {
    return undefined;
  }
  const m = /^(?:version\.)?content\.(\d+)\.editorFieldValues$/.exec(
    editorFieldValuesPath,
  );
  if (!m) {
    return undefined;
  }
  const i = Number.parseInt(m[1], 10);
  const row = data as {
    content?: unknown[];
    version?: { content?: unknown[] };
  };
  const underVersion = editorFieldValuesPath.startsWith("version.");
  const block = underVersion ? row.version?.content?.[i] : row.content?.[i];
  if (block && typeof block === "object" && block !== null) {
    const cd = (block as { componentDefinition?: unknown }).componentDefinition;
    if (isPresentRelationshipValue(cd)) {
      return cd;
    }
  }
  return undefined;
}

function resolveComponentDefinitionRef(args: {
  editorFieldValuesPath: string;
  fields: FormState;
  documentForm: { getDataByPath?: (path: string) => unknown } | undefined;
  form: { getDataByPath?: (path: string) => unknown } | undefined;
  getData: (() => unknown) | undefined;
  savedDocumentData: unknown;
}): unknown {
  const {
    editorFieldValuesPath,
    fields,
    documentForm,
    form,
    getData,
    savedDocumentData,
  } = args;
  let raw = componentDefinitionValueFromFormState(
    editorFieldValuesPath,
    fields,
  );
  if (isPresentRelationshipValue(raw)) {
    return raw;
  }
  raw = componentDefinitionFromGetDataByPath(
    documentForm,
    editorFieldValuesPath,
  );
  if (isPresentRelationshipValue(raw)) {
    return raw;
  }
  raw = componentDefinitionFromGetDataByPath(form, editorFieldValuesPath);
  if (isPresentRelationshipValue(raw)) {
    return raw;
  }
  if (typeof getData === "function") {
    raw = componentDefinitionFromDocumentData(getData(), editorFieldValuesPath);
    if (isPresentRelationshipValue(raw)) {
      return raw;
    }
  }
  raw = componentDefinitionFromDocumentData(
    savedDocumentData,
    editorFieldValuesPath,
  );
  if (isPresentRelationshipValue(raw)) {
    return raw;
  }
  return undefined;
}

function extractDefinitionId(raw: unknown): number | undefined {
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
      return extractDefinitionId((raw as { value: unknown }).value);
    }
  }
  return undefined;
}

/** Replaces the JSON editor with inputs derived from the selected component’s slot contract. */
function DesignerEditorFieldsField(props: JSONFieldClientProps) {
  const { path, field } = props;

  /**
   * Prefer `FieldPathContext` (correct in array rows); `path` from props can be stale until
   * re-render — see Payload `useField` `potentiallyStalePath` docs.
   */
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

  const componentRef = useFormFields(
    useCallback(
      (ctx: unknown) => {
        const [fields] = ctx as FormFieldsTuple;
        const getDataFn =
          typeof documentForm?.getData === "function"
            ? documentForm.getData
            : typeof form?.getData === "function"
              ? form.getData
              : undefined;
        return resolveComponentDefinitionRef({
          editorFieldValuesPath: fieldPath,
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

  const defId = useMemo(
    () => extractDefinitionId(componentRef),
    [componentRef],
  );

  /** Page API often populates the full definition (incl. `composition`); prefer that over a second fetch. */
  const definitionFromForm = useMemo((): ComponentDefinitionDoc | null => {
    const raw = componentRef;
    if (raw && typeof raw === "object" && !Array.isArray(raw) && "id" in raw) {
      return raw as ComponentDefinitionDoc;
    }
    return null;
  }, [componentRef]);

  const [contractDoc, setContractDoc] = useState<ComponentDefinitionDoc | null>(
    null,
  );
  const [loadError, setLoadError] = useState<string | null>(null);

  const effectiveDoc = useMemo(() => {
    if (definitionFromForm?.composition != null) {
      return definitionFromForm;
    }
    return contractDoc;
  }, [definitionFromForm, contractDoc]);

  useEffect(() => {
    if (defId === undefined) {
      setContractDoc(null);
      setLoadError(null);
      return;
    }

    let cancelled = false;
    setLoadError(null);

    void (async () => {
      try {
        const res = await fetch(`/api/components/${defId}?depth=0`, {
          credentials: "include",
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const json = (await res.json()) as { doc?: ComponentDefinitionDoc };
        const doc = json.doc ?? (json as ComponentDefinitionDoc);
        if (!cancelled) {
          setContractDoc(doc);
        }
      } catch (e) {
        if (!cancelled) {
          setContractDoc(null);
          setLoadError(
            e instanceof Error ? e.message : "Failed to load definition",
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [defId]);

  const editorFields: EditorFieldSpec[] = useMemo(() => {
    if (!effectiveDoc) {
      return [];
    }
    const rawComp = effectiveDoc.composition;
    if (rawComp !== undefined && rawComp !== null) {
      const comp = PageCompositionSchema.safeParse(rawComp);
      if (comp.success) {
        return editorFieldSpecsFromComposition(comp.data);
      }
    }
    return normalizeEditorFieldsContract(effectiveDoc.editorFields)
      .editorFields;
  }, [effectiveDoc]);

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

  if (defId === undefined) {
    return (
      <p className="rounded-none border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        Select a block above to edit its fields.
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
        {effectiveDoc
          ? "This component has no CMS fields yet. Expose content as editor-managed fields in the builder, then publish."
          : "Loading block…"}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {field?.label ? (
        <Label className="text-sm font-medium">{String(field.label)}</Label>
      ) : null}
      <EditorFieldsInputs
        current={current}
        disabled={disabled}
        fields={editorFields}
        patchField={patchField}
      />
    </div>
  );
}

export default DesignerEditorFieldsField;
