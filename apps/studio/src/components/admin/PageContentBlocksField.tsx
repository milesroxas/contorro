"use client";

/**
 * Wraps Payload’s default array field UI for `content` (slot hints + context for row fields).
 *
 * **Payload convention:** custom array `Field` components compose {@link ArrayField} and spread
 * `...props` — see https://payloadcms.com/docs/fields/array#custom-components
 *
 * The official `website` template uses `type: 'blocks'` for page layout; this app uses a single
 * `type: 'array'` of designer rows with `layoutSlotId` so runtime and gateway stay aligned.
 * Multi-slot templates show `MultiSlotAddBlocksToolbar` (same `addFieldRow` API as `ArrayField`).
 */
import { ArrayField, useDocumentInfo } from "@payloadcms/ui";
import {
  useDocumentForm,
  useForm,
  useFormFields,
} from "@payloadcms/ui/forms/Form";
import { PageCompositionSchema } from "@repo/contracts-zod";
import { orderedLayoutSlotIds } from "@repo/domains-composition";
import type { ArrayFieldClientComponent, FormState } from "payload";
import { useCallback, useEffect, useMemo, useState } from "react";

import { MultiSlotAddBlocksToolbar } from "./MultiSlotAddBlocksToolbar.js";
import {
  extractPageCompositionId,
  pageCompositionFromDocumentData,
  pageCompositionLooseFromFields,
  parseEmbeddedPageComposition,
} from "./page-composition-form-state.js";
import {
  TemplateLayoutSlotsProvider,
  type TemplateLayoutSlotsState,
} from "./template-layout-slots-context.js";

type FormFieldsTuple = [FormState, (action: never) => void];

const PageContentBlocksField: ArrayFieldClientComponent = (props) => {
  const { path, schemaPath, field } = props;
  const resolvedSchemaPath = schemaPath ?? field.name;
  const form = useForm();
  const documentForm = useDocumentForm();
  const { data: savedDocumentData } = useDocumentInfo();

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
        let raw = pageCompositionLooseFromFields(fields);
        if (!isPresentRelationshipValue(raw)) {
          for (const c of [documentForm, form]) {
            if (!c?.getDataByPath) {
              continue;
            }
            for (const p of ["version.pageComposition", "pageComposition"]) {
              try {
                const v = c.getDataByPath(p);
                if (isPresentRelationshipValue(v)) {
                  raw = v;
                  break;
                }
              } catch {
                /* invalid path */
              }
            }
            if (isPresentRelationshipValue(raw)) {
              break;
            }
          }
        }
        if (
          !isPresentRelationshipValue(raw) &&
          typeof getDataFn === "function"
        ) {
          raw = pageCompositionFromDocumentData(getDataFn());
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

  const [slotState, setSlotState] = useState<TemplateLayoutSlotsState>({
    status: "idle",
  });

  useEffect(() => {
    if (embedded !== null) {
      setSlotState({
        status: "ready",
        slotIds: orderedLayoutSlotIds(embedded),
        compositionId,
      });
      return;
    }

    if (compositionId === undefined) {
      setSlotState({ status: "idle" });
      return;
    }

    let cancelled = false;
    setSlotState({ status: "loading" });

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
          setSlotState({ status: "ready", slotIds: [], compositionId });
          return;
        }
        setSlotState({
          status: "ready",
          slotIds: orderedLayoutSlotIds(parsed.data),
          compositionId,
        });
      } catch {
        if (!cancelled) {
          setSlotState({ status: "ready", slotIds: [], compositionId });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [embedded, compositionId]);

  const rowCount = useFormFields(
    useCallback(
      (ctx: unknown) => {
        const [fields] = ctx as FormFieldsTuple;
        const v = fields[path]?.value;
        return Array.isArray(v) ? v.length : 0;
      },
      [path],
    ),
  );

  return (
    <TemplateLayoutSlotsProvider value={slotState}>
      <div className="space-y-3">
        {slotState.status === "ready" &&
        slotState.slotIds.length === 1 &&
        rowCount > 0 ? (
          <p className="text-xs text-muted-foreground">
            This template has one layout slot (
            <span className="font-mono text-foreground">
              {slotState.slotIds[0]}
            </span>
            ). Blocks are placed there automatically.
          </p>
        ) : null}
        {slotState.status === "ready" && slotState.slotIds.length > 1 ? (
          <MultiSlotAddBlocksToolbar
            path={path}
            schemaPath={resolvedSchemaPath}
          />
        ) : null}
        <ArrayField {...props} />
      </div>
    </TemplateLayoutSlotsProvider>
  );
};

function isPresentRelationshipValue(v: unknown): boolean {
  return v !== undefined && v !== null && v !== "";
}

export default PageContentBlocksField;
