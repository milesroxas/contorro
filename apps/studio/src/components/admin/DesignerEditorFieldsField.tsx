"use client";

import { useDocumentInfo, useField, useFieldPath } from "@payloadcms/ui";
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
import {
  collectBlockPathsForSiblingLookup,
  extractDefinitionId,
  normalizeEditorFieldValuesPath,
  resolveComponentDefinitionRef,
} from "@/lib/designer-editor-fields-resolution";

import { EditorFieldsInputs } from "./EditorFieldsInputs";

type FormFieldsTuple = [FormState, (action: never) => void];

type ComponentDefinitionDoc = {
  id?: number;
  composition?: unknown;
  editorFields?: unknown;
};

/** Replaces the JSON editor with inputs derived from the selected component’s slot contract. */
function DesignerEditorFieldsField(props: JSONFieldClientProps) {
  const { path, field } = props;

  /**
   * `useField().path` can lag behind after new array rows (e.g. adding a block). Context path stays
   * aligned with `*.editorFieldValues` for sibling `componentDefinition` resolution.
   */
  const pathFromContext = useFieldPath();

  /**
   * Prefer `FieldPathContext` (correct in array rows); `path` from props can be stale until
   * re-render — see Payload `useField` `potentiallyStalePath` docs.
   */
  const {
    value: rawValue,
    setValue,
    disabled,
    path: fieldPathFromHook,
  } = useField<Record<string, unknown>>({
    potentiallyStalePath: path,
  });

  const editorFieldValuesPathRaw =
    typeof pathFromContext === "string" &&
    pathFromContext.length > 0 &&
    pathFromContext.includes("editorFieldValues")
      ? pathFromContext
      : fieldPathFromHook;
  const editorFieldValuesPath = useMemo(
    () =>
      normalizeEditorFieldValuesPath(
        typeof editorFieldValuesPathRaw === "string"
          ? editorFieldValuesPathRaw
          : path,
      ),
    [editorFieldValuesPathRaw, path],
  );

  const siblingLookupPaths = useMemo(
    () =>
      collectBlockPathsForSiblingLookup(
        path,
        fieldPathFromHook,
        typeof pathFromContext === "string" ? pathFromContext : undefined,
      ),
    [path, fieldPathFromHook, pathFromContext],
  );

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
        const primaryEditorPath =
          siblingLookupPaths.find((p) => p === editorFieldValuesPath) ??
          siblingLookupPaths.find((p) => p.includes("editorFieldValues")) ??
          siblingLookupPaths[0] ??
          editorFieldValuesPath;
        return resolveComponentDefinitionRef({
          editorFieldValuesPath: primaryEditorPath,
          siblingLookupPaths,
          fields,
          documentForm,
          form,
          getData:
            typeof getDataFn === "function" ? () => getDataFn() : undefined,
          savedDocumentData,
        });
      },
      [
        editorFieldValuesPath,
        siblingLookupPaths,
        documentForm,
        form,
        savedDocumentData,
      ],
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

    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complexity cleanup backlog.
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
